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

define('argos/DialogPane', [
    'dojo/_base/declare',
    'dojo/dom-class',
    './Pane',
    './TitleBar'
], function(
    declare,
    domClass,
    Pane,
    TitleBar
) {
    return declare('argos.DialogPane', [Pane], {
        baseClass: 'dialog is-hidden',
        tier: false,
        components: [
            {name: 'top', type: TitleBar, attachEvent: 'onPositionChange:_onToolbarPositionChange', props: {managed: true, visible: false}},
            {name: 'container', tag: 'div', attrs: {'class': 'view-container'}, attachPoint: 'viewContainerNode'},
            {name: 'frame', tag: 'iframe'}
        ],
        buildRendering: function(){
            this.inherited(arguments);
            domClass.remove(this.domNode, "mblFixedSplitterPane");
        },
        show: function() {
            this.showDialog();
            return this.inherited(arguments);
        },
        showDialog: function() {
            domClass.remove(this.domNode, 'is-hidden');
        },
        hideDialog: function() {
            domClass.add(this.domNode, 'is-hidden');
        },
        _before: function(view, viewOptions, previous) {
            if (previous)
                this.hideDialog();

            this.inherited(arguments);
        }

    });
});