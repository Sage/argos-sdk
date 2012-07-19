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
    '../_TemplatedWidgetMixin',
    '../Format',
    './EditorField'
], function(
    declare,
    string,
    domClass,
    _TemplatedWidgetMixin,
    format,
    EditorField
) {
    return declare('Sage.Platform.Mobile.Fields.DateField', [EditorField], {
        // Localization
        emptyText: '',
        dateFormatText: 'MM/DD/YYYY',
        invalidDateFormatErrorText: "Field '${0}' has Invalid date format.",

        widgetTemplate: new Simplate([
            '<button data-dojo-attach-point="triggerNode" class="button whiteButton" aria-label="{%: $.lookupLabelText %}"><span>{%: $.lookupText %}</span></button>',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onchange:_onChange" type="text" />'
        ]),

        view: 'generic_calendar',
        showTimePicker: false,
        timeless: false,

        formatValue: function(value) {
            return format.date(value, this.dateFormatText, this.timeless);
        },
        _onChange: function(evt) {
            var val = moment(this.inputNode.value, this.dateFormatText).toDate();

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
        getValuesFromView: function(view) {
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
});