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
    'dojox/mobile/FixedSplitter',
    './_UiComponent',
    './Pane',
    './View'
], function(
    declare,
    lang,
    FixedSplitter,
    _UiComponent,
    Pane,
    View
) {
    return declare('Sage.Platform.Mobile.Layout', [FixedSplitter, _UiComponent], {
        orientation: 'H',
        panes: null,
        components: [
            {name: 'navigation', type: Pane, attachPoint: 'panes.navigation', props:{'class':'layout-left', tier: false}},
            {name: 'list', type: Pane, attachPoint: 'panes.list', props:{'class':'layout-center', tier: 0}},
            {name: 'detail', type: Pane, attachPoint: 'panes.detail', props:{'class':'layout-right', tier: 1}}
        ],
        constructor: function() {
            this.panes = {};
        },
        startup: function() {
            this.connect(window, 'onresize', this.resize);

            this.inherited(arguments);
        },
        /* todo: remove from the layout */
        show: function(view, options, at) {
            /* for now, just show it in the chosen container */
            /* is it going to be performant to move DOM nodes around? */
            this.panes[at || 'detail'].show(view, options);
        },
        hide: function(view) {
            /*
            for (var name in this.panes)
            {
                var pane = this.panes[name];
                if (pane.active === view)
                    pane.remove(view);
            }
            */
        }
    });
});