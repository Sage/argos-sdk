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
    'Sage/Platform/Mobile/Fields/EditorField',
    'Sage/Platform/Mobile/FieldManager'
], function(
    declare,
    EditorField,
    FieldManager
) {
    /**
     * The NoteField is a special case where an overly long text string should be inserted and
     * you want to take the user to another view for that specific input.
     *
     * The special part is that the it passes the value between its editor via an object with a
     * "Note" property., meaning the Edit View layout should have a field bound to the `noteProperty`
     * defined in this field ("Notes" by default").
     *
     * ###Example:
     *     {
     *         name: 'FullDescription',
     *         property: 'FullDescription',
     *         label: this.fullDescriptionText,
     *         type: 'note',
     *         view: 'text_editor_edit'
     *     }
     *
     * @alternateClassName NoteField
     * @extends EditorField
     * @requires FieldManager
     */
    var control = declare('Sage.Platform.Mobile.Fields.NoteField', [EditorField], {
        /**
         * @property {Object}
         * Provides a setter to the innerHTML attribute of the inputNode via noteText.
         */
        attributeMap: {
            noteText: {
                node: 'inputNode',
                type: 'innerHTML'
            }
        },
        /**
         * @property {Simplate}
         * Simplate that defines the fields HTML Markup
         *
         * * `$` => Field instance
         * * `$$` => Owner View instance
         *
         */
        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.lookupLabelText %}"><span>{%: $.lookupText %}</span></button>',
            '<div data-dojo-attach-point="inputNode" class="note-text"></div>'
        ]),

        // Localization
        /**
         * @property {String}
         * Text put into the field when no value (or null) is the current value.
         */
        emptyText: '',

        /**
         * @cfg {String}
         * The property that is used to set/get value from the editor view
         */
        noteProperty: 'Notes',

        /**
         * @cfg {String}
         * If defined it will be passed in the {@link createNavigationOptions navigation options} as `title`
         * to the editor view
         */
        title: null,

        _enableTextElement: function() {
        },
        _disableTextElement: function() {
        },
        /**
         * Extends the {@link EditorField#createNavigationOptions parent} implementation by
         * adding logic for using noteProperty and title
         * @return {Object} Navigation options
         */
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
        /**
         * Returns the value unless noteProperty is defined in which it extracts the value
         * from the object using noteProperty as the key
         * @param {String/Object} val
         * @return {String}
         */
        formatValue: function(val) {
            return this.noteProperty ? val[this.noteProperty] : val;
        },
        /**
         * Returns the current value
         * @return {String}
         */
        getValue: function() {
            return this.currentValue;
        },
        /**
         * Extends the {@link EditorField#getValuesFromView parent} implementation by
         * adding logic for using noteProperty
         */
        getValuesFromView: function() {
            this.inherited(arguments);

            if (!this.noteProperty)
            {
                this.currentValue = this.currentValue.Notes;
                this.validationValue = this.validationValue.Notes;
            }
        },
        /**
         * Sets the given text to the inputNode
         * @param {String} text
         */
        setText: function(text) {
            this.set('noteText', text);
        }
    });

    return FieldManager.register('note', control);
});