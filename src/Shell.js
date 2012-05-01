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

define('Sage/Platform/Mobile/Shell', [
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
    return declare('Sage.Platform.Mobile.Shell', [FixedSplitter, _UiComponent], {
        orientation: 'H',
        components: [
            {type: Pane, attachPoint: 'left', attachEvent: {}, components: [{type: View, attachPoint: 'viewA,viewAB', props: {}}], props:{'class':'shell-left'}},
            {type: Pane, attachPoint: 'center', attachEvent: {}, components: [{type: View, props: {}}], props:{'class':'shell-center'}},
            {type: Pane, attachPoint: 'right', attachEvent: {}, components: [{type: View, props: {}}], props:{'class':'shell-right'}}
        ],
        postCreate: function() {
            /* todo: buffer this? */
            this.connect(window, 'onresize', this.resize);
        },
        startup: function() {
            this.inherited(arguments);
        },
        show: function(view, options, at) {
            /* for now, just show it in the chosen container */
            /* is it going to be performant to move DOM nodes around? */
            this[at || 'right'].show(view, options);
        }
    });
});