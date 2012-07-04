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

define('Sage/Platform/Mobile/Pane', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/Deferred',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojox/mobile/FixedSplitterPane',
    './_UiComponent',
    './Toolbar',
    './View'
], function(
    declare,
    lang,
    Deferred,
    domStyle,
    domClass,
    FixedSplitterPane,
    _UiComponent,
    Toolbar,
    View
) {
    return declare('Sage.Platform.Mobile.Pane', [FixedSplitterPane, _UiComponent], {
        components: [
            /* todo: let a view own its toolbar? */
        ],
        active: null,
        show: function(view, options) {
            var deferred = new Deferred();

            /* - add the new view to this domNode
             * - do transition, remove old view from domNode ?
             * - or leave view in the container until it is needed elsewhere?
             * - save on dom movement and better back button support?
             *
             * - or have several configurations of views, one for tablets, and one for mobile?
             *   where views are assigned directly to containers?
             */

            /* todo: why does this fix display issue on Android 3.0 tablet? */
            /* - the nodes are not painted correctly without the timeout
             * - some items are not displayed, normally the main view, but can be interacted with
             * - rotating the tablet causes it to paint correctly.
             * - even happens with OpenGL rendering disabled.
             */
            setTimeout(lang.hitch(this, function() {
                if (this.active === view)
                {
                    /* todo: is `reload` an appropriate name for this? */
                    view.reload();

                    deferred.resolve(true);

                    return deferred;
                }

                // domStyle.set(view.domNode, 'display', 'none');

                domClass.remove(view.domNode, 'is-visible');

                view.placeAt(this.domNode);

                var previous = this.active;
                if (previous) previous.beforeTransitionAway();

                view.beforeTransitionTo();

                //if (previous) domStyle.set(previous.domNode, 'display', 'none');

                if (previous) domClass.remove(previous.domNode, 'is-visible');

                // domStyle.set(view.domNode, 'display', 'block');

                domClass.add(view.domNode, 'is-visible');

                view.transitionTo();

                if (previous) previous.transitionAway();

                this.active = view;

                if (view.resize) view.resize();

                deferred.resolve(true);
            }));

            return deferred;
        },
        empty: function() {
            var deferred = new Deferred(),
                previous = this.active;
            if (previous) previous.domNode.parentNode.removeChild(previous.domNode);

            this.active = null;

            deferred.resolve(true);

            return deferred;
        },
        resize: function() {
            // skip default implementation, only resize active child
            if (this.active && this.active.resize)
                this.active.resize();
        }
    });
});