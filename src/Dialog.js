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

define('argos/Dialog', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    './_UiComponent'
], function(
    declare,
    lang,
    domClass,
    _WidgetBase,
    _UiComponent
) {
    return declare('argos.Dialog', [_WidgetBase, _UiComponent], {
        events: {
            'click': true
        },
        baseClass: 'dialog is-hidden',
        components: [
            {name: 'content', tag: 'div', attrs: {'class': 'dialog-content'}},
            {name: 'frame', tag: 'iframe'}
        ],

        /**
         * @config {Object[]}
         * Components array that will be attached to the dialog as content.
         */
        content: null,

        /**
         * @config {Boolean}
         * Controls the "close by tapping outside the dialog" and other related restrictions
         */
        modal: true,

        /**
         * @config {Object}
         * Context owner of the dialog.
         */
        owner: null,

        constructor: function(o) {
            lang.mixin(this, o);
        },
        startup: function() {
            if (this.content)
                this.getComponents()[0].components = this.content;

            this.inherited(arguments);
        },
        onStartup: function() {

            // todo: place onto screen hidden
            this.placeAt(this.owner.domNode, 'last');
        },
        open: function() {
            // todo: show iframe according to `modal` flag
            // todo: show dialog (visibility/animation)
        },
        close: function() {
            // todo: hide iframe
            // todo: hide dialog
        },

        onContentChange: function() {
        }
    });
});