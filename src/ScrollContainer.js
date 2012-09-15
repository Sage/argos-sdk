/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define('Sage/Platform/Mobile/ScrollContainer', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    './_UiComponent',
    './Utility'
], function(
    declare,
    lang,
    domClass,
    _WidgetBase,
    _UiComponent,
    utility
) {
    var onBeforeScrollStart = function(e) {
        var target = e.target;
        while (target.nodeType != 1) target = target.parentNode;

        if (target.tagName != 'SELECT' && target.tagName != 'INPUT' && target.tagName != 'TEXTAREA')
            e.preventDefault();
    };

    /* todo: going to need some way to temporarily turn off the iScroll container when view is not visible, i.e. resize events. */
    return declare('Sage.Platform.Mobile.ScrollContainer', [_WidgetBase, _UiComponent], {
        baseClass: 'scroll-container',
        enableFormFix: false,
        /**
         * @cfg {Boolean}
         * Bypass the touch detection and force iscroll to be used.
         */
        forceScroller: false,
        useTransition: true,
        /**
         * @cfg {String}
         * Similar to a `data-action`, set to the name of a function on the parent view to be called
         * when the scroll is "pulled down" beyond the top of container.
         */
        onPullDown: null,
        /**
         * @cfg {String}
         * Similar to a `data-action`, set to the name of a function on the parent view to be called
         * when the scroll is "pulled up" below the container.
         */
        onPullUp: null,
        onMove: null,
        onStart: null,
        onEnd: null,
        /**
         * @property {Boolean}
         * Scroll down below the container detected in {@link #onScrollMove onScrollMove},
         * to then invoke the related action in {@link #onScrollEnd onScrollEnd}.
         */
        _pulledDown: null,
        /**
         * @property {Boolean}
         * Scroll up above the container detected in {@link #onScrollMove onScrollMove},
         * to then invoke the related action in {@link #onScrollEnd onScrollEnd}.
         */
        _pulledUp: null,

        startup: function() {
            this.inherited(arguments);

            var child = this.domNode.children[0];
            if (child) domClass.add(child, 'scroll-content');

            var useScroller = this.forceScroller || ('ontouchstart' in window);
            if (useScroller)
            {
                var options = {
                    useTransition: this.useTransition,
                    checkDOMChanges: false,
                    hScrollbar: false,
                    vScrollbar: false
                };

                if (this.enableFormFix) options.onBeforeScrollStart = onBeforeScrollStart;

                if (this.onMove || this.onStart || this.onEnd)
                {
                    var scope = this.getComponentOwner();
                    if (this.onMove) options.onScrollMove = utility.expand(scope, this.onMove);
                    if (this.onStart) options.onScrollStart = utility.expand(scope, this.onStart);
                    if (this.onEnd) options.onScrollEnd = utility.expand(scope, this.onEnd);
                }

                if (this.onPullDown || this.onPullUp)
                {
                    options.onScrollMove = this._onScrollMove.bindDelegate(this);
                    options.onScrollEnd = this._onScrollEnd.bindDelegate(this);
                }


                this._scroll = new iScroll(this.domNode, options);
            }
        },
        _onScrollMove: function(e) {
            var scroller = this._scroll;
            if (scroller.y > 5)
            {
                this._pulledDown = true;
                scroller.minScrollY = 0;
            }
            else if (scroller.y < (scroller.maxScrollY - 5))
            {
                this._pulledUp = true;
            }
        },
        _onScrollEnd: function() {
            var scope = this.getComponentOwner();

            if (this._pulledDown && this.onPullDown)
            {
                scope[this.onPullDown].apply(scope);
            }
            else if (this._pulledUp && this.onPullUp)
            {
                scope[this.onPullUp].apply(scope);
            }

            this._pulledDown = false;
            this._pulledUp = false;
        },
        onContentChange: function() {
            console.log('content changed: %s', this.getComponentOwner().id);
            if (this._scroll)
                this._scroll.refresh();
        },
        destroy: function(preserveDom) {
            if (this._scroll)
            {
                this._scroll.destroy(!preserveDom);

                delete this._scroll;
            }

            this.inherited(arguments);
        },
        scrollTo: function(x, y, time, relative) {
            if (this._scroll)
                this._scroll.scrollTo(x, y, time, relative);
        }
    });

});