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


define('Sage/Platform/Mobile/Fields/DateField', [
    'dojo/_base/declare',
    'dojo/string',
    'dojo/dom-class',
    'Sage/Platform/Mobile/Format',
    'Sage/Platform/Mobile/FieldManager',
    'Sage/Platform/Mobile/Fields/EditorField',
    'Sage/Platform/Mobile/Calendar'
], function(
    declare,
    string,
    domClass,
    format,
    FieldManager,
    EditorField
) {
    /**
     * The DateField is an extension of the {@link EditorField EditorField} by accepting Date Objects
     * for values and using the {@link Calendar Calendar} view for user input.
     * @alternateClassName DateField
     * @extends EditorField
     * @requires Calendar
     * @requires format
     */
    var control = declare('Sage.Platform.Mobile.Fields.DateField', [EditorField], {
        // Localization
        /**
         * @property {String}
         * The text shown when no value (or null/undefined) is set to the field.
         */
        emptyText: '',
        /**
         * @property {String}
         * The [Datejs format](http://code.google.com/p/datejs/wiki/FormatSpecifiers) the date will be
         * formatted when displaying in the field.
         */
        dateFormatText: 'MM/dd/yyyy',
        /**
         * @property {String}
         * The error validation message for this field.
         *
         * `${0}` => Label
         */
        invalidDateFormatErrorText: "Field '${0}' has Invalid date format.",

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
            '<button data-dojo-attach-point="triggerNode" data-action="navigateToEditView" class="button whiteButton" aria-label="{%: $.lookupLabelText %}"><span>{%: $.lookupText %}</span></button>',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onchange:_onChange" type="text" />'
        ]),

        view: 'generic_calendar',
        showTimePicker: false,
        timeless: false,

        formatValue: function(value) {
            return format.date(value, this.dateFormatText, this.timeless);
        },
        _onChange: function(evt) {
            var val = Date.parseExact(this.inputNode.value, this.dateFormatText);

            if (val)
            {
                this.validationValue = this.currentValue = val;
                domClass.remove(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
            }
            else
            {
                this.validationValue = this.currentValue = null;
                domClass.add(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
            }
        },
        createNavigationOptions: function() {
            var options = this.inherited(arguments);

            options.date = this.currentValue;
            options.showTimePicker = this.showTimePicker;
            options.timeless = this.timeless;

            return options;
        },
        getValuesFromView: function() {
            var view = App.getPrimaryActiveView();
            if (view)
            {
                this.currentValue = this.validationValue = view.getDateTime();
                domClass.remove(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
            }
        },
        isDirty: function() {
            return this.originalValue instanceof Date && this.currentValue instanceof Date
                ? this.originalValue.getTime() != this.currentValue.getTime()
                : this.originalValue !== this.currentValue;
        },
        clearValue: function() {
            this.inherited(arguments);
            domClass.remove(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
        },
        validate: function() {
            if (this.inputNode.value !== '' && !this.currentValue)
                return string.substitute(this.invalidDateFormatErrorText, [this.label]);

            return this.inherited(arguments);
        }
    });

    return FieldManager.register('date', control);
});