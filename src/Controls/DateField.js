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

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    var U = Sage.Platform.Mobile.Utility;

    Sage.Platform.Mobile.Controls.DateField = Ext.extend(Sage.Platform.Mobile.Controls.EditorField, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button whiteButton"><span>{%: $.lookupText %}</span></a>',
            '<input type="text" />'
        ]),
        view: 'generic_calendar',
        emptyText: '',
        formatString: 'MM/dd/yyyy',
        showTimePicker: false,
        formatValue: function(value) {
            return Sage.Platform.Mobile.Format.date(value, this.formatString);
        },
        createNavigationOptions: function() {
            var options = Sage.Platform.Mobile.Controls.DateField.superclass.createNavigationOptions.apply(this, arguments);

            options.date = this.currentValue;
            options.showTimePicker = this.showTimePicker;

            return options;
        },
        isDirty: function() {
            try
            {
                return !this.originalValue.equals(this.currentValue);
            }
            catch(e)
            {
                return this.originalValue !== this.currentValue;
            }
        },
        setOrigValue: function(value) {
            if (value && value.clone) this.originalValue = value.clone();
            else this.originalValue = value;
        },
        getValuesFromView: function() {
            var view = App.getActiveView();
            if (view)
            {
                this.currentValue = this.validationValue = view.getDateTime();
            }
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('date', Sage.Platform.Mobile.Controls.DateField);
})();