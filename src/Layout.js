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
    'dojo/_base/Deferred',
    'dojo/DeferredList',
    'dojox/mobile/FixedSplitter',
    './_UiComponent',
    './Pane',
    './View'
], function(
    declare,
    lang,
    Deferred,
    DeferredList,
    FixedSplitter,
    _UiComponent,
    Pane,
    View
) {
    return declare('Sage.Platform.Mobile.Layout', [FixedSplitter, _UiComponent], {
        components: [
            {name: 'navigation', type: Pane, attachPoint: 'panes.navigation', props:{'class':'layout-left', tier: false}},
            {name: 'list', type: Pane, attachPoint: 'panes.list', props:{'class':'layout-center', tier: 0}},
            {name: 'detail', type: Pane, attachPoint: 'panes.detail', props:{'class':'layout-right', tier: 1}}
        ],
        panes: null,
        panesByTier: null,
        tiers: 2,
        maximized: -1,
        orientation: 'H',
        constructor: function() {
            this.panes = {};
            this.panesByTier = [];
        },
        startup: function() {
            this.connect(window, 'onresize', this.resize);

            for (var name in this.panes)
            {
                if (this.panes[name].tier !== false)
                    this.panesByTier[this.panes[name].tier] = this.panes[name];
            }

            this.inherited(arguments);
        },
        apply: function(viewSet) {
            var wait = [];

            for (var tier = 0; tier < viewSet.length; tier++)
            {
                var entry = viewSet[tier];
                if (entry.view)
                {
                    wait.push(this.panesByTier[tier].show(entry.view));
                }
                else
                {
                    wait.push(this.panesByTier[tier].empty());
                }
            }

            return new DeferredList(wait, false, true, true);
        },
        show: function(view, at) {
            var pane = this.panes[at];
            if (pane)
            {
                if (view)
                    return pane.show(view);
                else
                    return pane.empty();
            }

            /* todo: return empty deferred? */
        }
    });
});