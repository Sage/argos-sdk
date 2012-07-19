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

define('Sage/Platform/Mobile/Fields/NoteField', [
    'dojo/_base/declare',
    './EditorField'
], function(
    declare,
    EditorField
) {
    return declare('Sage.Platform.Mobile.Fields.NoteField', [EditorField], {
        attributeMap: {
            noteText: {
                node: 'inputNode',
                type: 'innerHTML'
            }
        },
        widgetTemplate: new Simplate([
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.lookupLabelText %}"><span>{%: $.lookupText %}</span></button>',
            '<div data-dojo-attach-point="inputNode" class="note-text"></div>'
        ]),

        // Localization
        emptyText: '',
        
        noteProperty: 'Notes',

        _enableTextElement: function() {
        },
        _disableTextElement: function() {
        },
        createNavigationOptions: function() {
            var options = this.inherited(arguments);
            //Name does not have an entity.
            delete options.entityName;

            if (!this.noteProperty)
            {
                options.entry = {'Notes': options.entry};
                options.changes = {'Notes': options.changes};
            }

            if (this.title)
                options.title = this.title;

            return options;
        },
        formatValue: function(val) {
            return this.noteProperty ? val[this.noteProperty] : val;
        },
        getValue: function() {
            return this.currentValue;
        },
        getValuesFromView: function() {
            this.inherited(arguments);

            if (!this.noteProperty)
            {
                this.currentValue = this.currentValue.Notes;
                this.validationValue = this.validationValue.Notes;
            }
        },
        setText: function(text) {
            this.set('noteText', text);
        }
    });
});