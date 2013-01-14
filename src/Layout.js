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

/**
 * Layout, as the name implies, handles the physical laying out of Panes by utilizing dojox/mobile/FixedSplitted.
 *
 * Think of Scene as the topmost level as a pool or collection of views. Layout (which is the only
 * component of Scene) organizes the app into distinct groups (tiers) and handles the identificaton
 * of which view gets shown where.
 *
 * As an example: code calls `scene().showView('home')`. Scene does the lookup and gets the home view and
 * passes control to Layout which looks at the home view see's that its tier 0 and shows it
 * inside the Pane designed for tier 0 views.
 *
 * The components of layout (which should be Panes, or derivatives) that contain the class 'mblFixedSplitterPane'
 * will have their width/height adjusted (based on orientation).
 *
 * @alternateClassName Layout
 * @extends _UiComponent
 * @requires Pane
 */
define('argos/Layout', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/window',
    'dojo/_base/Deferred',
    'dojo/DeferredList',
    'dojo/dom-class',
    'dojo/dom-style',
    'dojo/dom-geometry',
    'dojo/dom-construct',
    'dojo/topic',
    'dojox/mobile/FixedSplitter',
    './_UiComponent',
    './Pane',
    'argos!application'
], function(
    declare,
    lang,
    array,
    win,
    Deferred,
    DeferredList,
    domClass,
    domStyle,
    domGeom,
    domConstruct,
    topic,
    FixedSplitter,
    _UiComponent,
    Pane,
    application
) {
    return declare('argos.Layout', [FixedSplitter, _UiComponent], {
        /**
         * @cfg {Object[]}
         * Array of component definitions.
         *
         * In the special case of Layout each of the components should be some derivative of Pane.
         *
         * Also, if the domNode of the Pane includes the CSS class `mblFixedSplitterPane` then it
         * will be styled (width/height) accordingly in regards to the other Panes (fitting them onto
         * the screen).
         *
         */
        components: [
            {name: 'navigation', type: Pane, attachPoint: 'panes.navigation', props:{'class':'layout-left', tier: false}},
            {name: 'list', type: Pane, attachPoint: 'panes.list', props:{'class':'layout-center', tier: 0}},
            {name: 'detail', type: Pane, attachPoint: 'panes.detail', props:{'class':'layout-right', tier: 1}}
        ],

        _onCheckViewportHeightHandle: null,
        _lastViewportHeight: null,

        /**
         * @property {Object}
         * This object will be populated by the resulting panes from the child components as noted by
         * the `attachPoint: 'panes.list'`, `panes.detail` etc.
         */
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
        /**
         * Overrides dojox.mobile.FixedSplitter to include test for non-layout panes.
         * It only includes Panes in the splitter width calculations if the css class
         * `mblFixedSplitterPane` is found on the child node.
         *
         * This enables Panes to be layered as needed.
         */
        layout: function(){
            var sz = this.orientation == "H" ? "w" : "h",
                isTablet = application().isTablet;

            var children = [];
            for (var paneId in this.panes)
            {
                var pane = this.panes[paneId];
                if (isTablet)
                {
                    if (pane.tier !== false)
                        children.push(pane.domNode);
                }
                else
                {
                    if (pane.root)
                        children.push(pane.domNode);
                }
            }

            var offset = 0;
            for(var i = 0; i < children.length; i++){
                domGeom.setMarginBox(children[i], this.orientation == "H" ? {l:offset} : {t:offset});
                if(i < children.length - 1){
                    offset += domGeom.getMarginBox(children[i])[sz];
                }
            }

            var h;
            if(this.orientation == "V"){
                if(this.domNode.parentNode.tagName == "BODY"){
                    if(array.filter(win.body().childNodes, function(node){ return node.nodeType == 1; }).length == 1){
                        h = (win.global.innerHeight||win.doc.documentElement.clientHeight);
                    }
                }
            }
            var l = (h || domGeom.getMarginBox(this.domNode)[sz]) - offset;
            var props = {};
            props[sz] = l;
            domGeom.setMarginBox(children[children.length - 1], props);

            array.forEach(this.getChildren(), function(child){
                if(child.resize){ child.resize(); }
            });
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
                    topic.publish('/app/layout/change', {
                        tier: tier,
                        pane: this.panesByTier[tier]
                    });
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

            topic.publish('/app/layout/change', {
                tier: at,
                pane: this.panes[at]
            });

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