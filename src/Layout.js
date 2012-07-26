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

define('Sage/Platform/Mobile/Layout', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/window',
    'dojo/_base/Deferred',
    'dojo/DeferredList',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/dom-geometry',
    'dojo/dom-construct',
    'dojox/mobile/FixedSplitter',
    './_UiComponent',
    './Pane'
], function(
    declare,
    lang,
    win,
    Deferred,
    DeferredList,
    domClass,
    domStyle,
    domGeom,
    domConstruct,
    FixedSplitter,
    _UiComponent,
    Pane
) {
    return declare('Sage.Platform.Mobile.Layout', [FixedSplitter, _UiComponent], {
        components: [
            {name: 'navigation', type: Pane, attachPoint: 'panes.navigation', props:{'class':'layout-left', tier: false}},
            {name: 'list', type: Pane, attachPoint: 'panes.list', props:{'class':'layout-center', tier: 0}},
            {name: 'detail', type: Pane, attachPoint: 'panes.detail', props:{'class':'layout-right', tier: 1}}
        ],

        _onCheckViewportHeightHandle: null,
        _lastViewportHeight: null,

        panes: null,
        panesByTier: null,
        tiers: 2,
        maximized: -1,
        orientation: 'H',
        heightFixNode: null,

        _createHeightFixNode: function() {
            return domConstruct.create('div', {
                'class': 'layout-height-fix is-hidden'
            }, win.body());
        },
        _onCheckViewportHeight: function() {
            if (window.innerHeight != this._lastViewportHeight)
            {
                this.resize();
                this._lastViewportHeight = window.innerHeight;
            }
        },
        hideNativeUrlBar: function() {
            if (!this.heightFixNode) this.heightFixNode = this._createHeightFixNode();

            domClass.remove(this.heightFixNode, 'is-hidden');

            var self = this;
            setTimeout(function () {
                window.scrollTo(0,1);
            }, 0);

            setTimeout(function() {
                window.scrollTo(0,0);

                domClass.add(self.heightFixNode, 'is-hidden');

                self.resize();
            }, 0);
        },
        constructor: function() {
            this.panes = {};
            this.panesByTier = [];
        },
        onStartup: function() {
            this.inherited(arguments);

            this.connect(window, 'onresize', this.resize);

            for (var name in this.panes)
            {
                if (this.panes[name].tier !== false)
                    this.panesByTier[this.panes[name].tier] = this.panes[name];
            }

            /* todo: this BREAKS input focus scrolling on iOS (sizes are calculated wrong) */
            /*
            var hasTouch = 'ontouchstart' in window;
            if (hasTouch)
            {
                this.hideNativeUrlBar();

                // if the bar is shown, `window.innerHeight` reflects the change, but resize is never called.
                this._lastViewportHeight = window.innerHeight;
                this._onCheckViewportHeightHandle = setInterval(lang.hitch(this, this._onCheckViewportHeight), 50);
            }
            */
        },
        onDestroy: function() {
            this.inherited(arguments);

            clearInterval(this._onCheckViewportHeightHandle);

            delete this._onCheckViewportHeightHandle;
        },
        _createTransitionOptionsFor: function(view, sceneHint) {
            if (sceneHint.empty)
            {
                return {
                    transition: 'zoom',
                    always: sceneHint.always
                };
            }

            /* no panes are maximized, views slide in L->R, default is L<-R. */
            if (sceneHint.initial)
            {
                return {
                    transition: 'basic'
                };
            }

            if (this.maximized < 0)
            {
                return {
                    transition: 'slide',
                    reverse: !sceneHint.reverse,
                    always: sceneHint.always
                };
            }
            else
            {
                return {
                    transition: 'slide',
                    reverse: sceneHint.reverse,
                    always: sceneHint.always
                };
            }
        },
        apply: function(viewSet) {
            var wait = [];

            for (var tier = 0; tier < viewSet.length; tier++)
            {
                var item = viewSet[tier],
                    transitionOptions = this._createTransitionOptionsFor(item.view, item);

                if (item.view)
                {
                    wait.push(this.panesByTier[tier].show(item.view, transitionOptions));
                }
                else
                {
                    wait.push(this.panesByTier[tier].empty(transitionOptions));
                }
            }

            return new DeferredList(wait, false, true, true);
        },
        show: function(view, at, transitionOptions) {
            var pane = this.panes[at];
            if (pane)
            {
                if (view)
                    return pane.show(view, transitionOptions);
                else
                    return pane.empty(transitionOptions);
            }

            /* todo: return empty deferred? */
        },
        resize: function() {
            var hasTouch = 'ontouchstart' in window;
            if (hasTouch)
            {
                /* this is required in order to hide the native URL bar */
                /* todo: this BREAKS input focus scrolling on iOS (sizes are calculated wrong) */
                /*
                domGeom.setMarginBox(this.domNode, {
                    w: window.innerWidth,
                    h: window.innerHeight
                });
                */
            }

            this.inherited(arguments);
        }
    });
});