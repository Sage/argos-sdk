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

define('Sage/Platform/Mobile/Fields/DateField', ['Sage/Platform/Mobile/Fields/EditorField', 'Sage/Platform/Mobile/Calendar', 'Sage/Platform/Mobile/Format'], function() {
    var control = dojo.declare('Sage.Platform.Mobile.Fields.DateField', [Sage.Platform.Mobile.Fields.EditorField], {
        // Localization
        emptyText: '',
        dateFormatText: 'MM/dd/yyyy',
        invalidDateFormatErrorText: "Field '${0}' has Invalid date format.",

        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button data-dojo-attach-point="triggerNode" data-action="navigateToEditView" class="button whiteButton" aria-label="{%: $.lookupLabelText %}"><span>{%: $.lookupText %}</span></button>',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onchange:_onChange" type="text" />'
        ]),
        view: 'generic_calendar',
        showTimePicker: false,
        formatValue: function(value) {
            return Sage.Platform.Mobile.Format.date(value, this.dateFormatText);
        },
        _onChange: function(evt) {
            var val = Date.parseExact(this.inputNode.value, this.dateFormatText);

            if (val)
            {
                this.validationValue = this.currentValue = val;
                dojo.removeClass(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
            }
            else
            {
                this.validationValue = this.currentValue = null;
                dojo.addClass(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
            }
        },
        createNavigationOptions: function() {
            var options = this.inherited(arguments);

            options.date = this.currentValue;
            options.showTimePicker = this.showTimePicker;

            return options;
        },
        getValuesFromView: function() {
            var view = App.getPrimaryActiveView();
            if (view)
            {
                this.currentValue = this.validationValue = view.getDateTime();
                dojo.removeClass(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
            }
        },
        isDirty: function() {
            return this.originalValue instanceof Date && this.currentValue instanceof Date
                ? this.originalValue.getTime() != this.currentValue.getTime()
                : this.originalValue !== this.currentValue;
        },
        clearValue: function() {
            this.inherited(arguments);
            dojo.removeClass(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
        },
        validate: function() {
            if (this.inputNode.value !== '' && !this.currentValue)
                return dojo.string.substitute(this.invalidDateFormatErrorText, [this.label]);

            return this.inherited(arguments);
        }
    });

    return Sage.Platform.Mobile.FieldManager.register('date', control);
});