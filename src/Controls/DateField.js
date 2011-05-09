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
        attachmentPoints: {
            'triggerBtn': '.button'
        },
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button whiteButton" aria-label="{%: $.lookupLabelText %}"><span>{%: $.lookupText %}</span></button>',
            '<input type="text" />'
        ]),
        view: 'generic_calendar',
        emptyText: '',
        formatString: 'MM/dd/yyyy',
        showTimePicker: false,
        invalidDateFormatError: "Field '{0}' has Invalid date format.",
        formatValue: function(value) {
            return Sage.Platform.Mobile.Format.date(value, this.formatString);
        },
        init: function() {
            Sage.Platform.Mobile.Controls.EditorField.superclass.init.apply(this, arguments);

            this.el.on('change', this.onChange, this, {stopEvent: true});
            this.triggerBtn.on('click', this.onClick, this, {stopEvent: true});
        },
        onChange: function(evt, el, o) {
            if (!el) return;

            if (el.value.trim() === '')
            {
                this.validationValue = this.currentValue = null;
                return;
            }

            var val = Date.parse(el.value, this.formatString);
            if (val)
            {
                this.validationValue = this.currentValue = val;
                this.containerEl.removeClass('row-error'); // todo: not the right spot for this, add validation eventing
            }
            else
            {
                this.validationValue = this.currentValue = null;
                this.containerEl.addClass('row-error'); // todo: not the right spot for this, add validation eventing
            }
        },
        createNavigationOptions: function() {
            var options = Sage.Platform.Mobile.Controls.DateField.superclass.createNavigationOptions.apply(this, arguments);

            options.date = this.currentValue;
            options.showTimePicker = this.showTimePicker;

            return options;
        },
        getValuesFromView: function() {
            var view = App.getActiveView();
            if (view)
            {
                this.currentValue = this.validationValue = view.getDateTime();
                this.containerEl.removeClass('row-error'); // todo: not the right spot for this, add validation eventing
            }
        },
        isDirty: function() {
            return this.originalValue instanceof Date && this.currentValue instanceof Date
                ? this.originalValue.getTime() != this.currentValue.getTime()
                : this.originalValue !== this.currentValue;
        },
        clearValue: function() {
            Sage.Platform.Mobile.Controls.DateField.superclass.clearValue.apply(this, arguments);
            this.containerEl.removeClass('row-error'); // todo: not the right spot for this, add validation eventing
        },
        validate: function() {
            if (this.el.dom.value !== '' && !this.currentValue)
                return String.format(this.invalidDateFormatError, this.label);

            return Sage.Platform.Mobile.Controls.DateField.superclass.validate.apply(this, arguments);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('date', Sage.Platform.Mobile.Controls.DateField);
})();