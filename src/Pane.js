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
    'dojo/dom-style',
    'dojox/mobile/FixedSplitterPane',
    './_UiComponent',
    './Toolbar',
    './View'
], function(
    declare,
    lang,
    domStyle,
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
            /* - add the new view to this domNode
             * - do transition, remove old view from domNode ?
             * - or leave view in the container until it is needed elsewhere?
             * - save on dom movement and better back button support?
             *
             * - or have several configurations of views, one for tablets, and one for mobile?
             *   where views are assigned directly to containers?
             */

            if (this.active === view)
            {
                /* todo: fix ... there should be a way to tell a view to refresh if required. */
                view.beforeTransitionTo();
                view.transitionTo();

                return;
            }

            domStyle.set(view.domNode, 'display', 'none');

            view.placeAt(this.domNode);

            var previous = this.active;
            if (previous) previous.beforeTransitionAway();

            view.beforeTransitionTo();

            if (previous) domStyle.set(previous.domNode, 'display', 'none');

            domStyle.set(view.domNode, 'display', 'block');

            view.transitionTo();

            if (previous) previous.transitionAway();

            this.active = view;
        },
        empty: function() {
            var previous = this.active;
            if (previous) previous.domNode.parentNode.removeChild(previous.domNode);
        }
    });
});