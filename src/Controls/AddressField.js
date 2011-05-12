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

// todo: move to argos-saleslogix; this does not belong here.

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.AddressField = Ext.extend(Sage.Platform.Mobile.Controls.EditorField, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.lookupLabelText %}"><span>{%: $.lookupText %}</span></button>',
            '<div></div>'
        ]),
        rows: 4,
        lookupLabelText: 'edit',
        emptyText: 'no address',

        _enableTextElement: function() {
        },
        _disableTextElement: function() {
        },
        setText: function(text) {
            this.el.dom.innerHTML = text;
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('address', Sage.Platform.Mobile.Controls.AddressField);
})();