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
    Sage.Platform.Mobile.Controls.PhoneField = Ext.extend(Sage.Platform.Mobile.Controls.TextField, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<input type="text" name="{%= name %}">'
        ]),
        /*
            {0}: original value
            {1}: cleaned value
            {2}: entire match (against clean value)
            {3..n}: match groups (against clean value)
        */
        formatters: [{
            test: /^\+.*/,
            format: '{0}'
        },{
            test: /^(\d{3})(\d{3,4})$/,
            format: '{3}-{4}'
        },{
            test: /^(\d{3})(\d{3})(\d{2,4})$/, // 555 555 5555
            format: '({3})-{4}-{5}'
        },{
            test: /^(\d{3})(\d{3})(\d{2,4})([^0-9]{1,}.*)$/, // 555 555 5555x
            format: '({3})-{4}-{5}{6}'
        },{
            test: /^(\d{11,})(.*)$/,
            format: '{1}'
        }],
        onBlur: function() {
            Sage.Platform.Mobile.Controls.PhoneField.superclass.onBlur.apply(this, arguments);

            // temporarily added: http://code.google.com/p/android/issues/detail?id=14519
            this.el.dom.value = this.formatNumberForDisplay(this.el.dom.value, this.getValue());
        },
        getValue: function() {
            var value = this.el.getValue();

            if (/^\+/.test(value)) return value;

            return value.replace(/[^0-9x]/ig, "");
        },
        setValue: function(val, initial) {
            if (initial) this.originalValue = val;
            
            this.previousValue = false;

            this.el.dom.value = this.formatNumberForDisplay(val);
        },
        formatNumberForDisplay: function(number, clean) {
            if (typeof clean === 'undefined') clean = number;

            for (var i = 0; i < this.formatters.length; i++)
            {
                var formatter = this.formatters[i],
                    match;
                if ((match = formatter.test.exec(clean)))
                {                    
                    return String.format.apply(String, [formatter.format, number, clean].concat(match));
                }
            }

            return number;
        },               
        onKeyUp: function(evt, el, o) {
            /*
            // temporarily removed: http://code.google.com/p/android/issues/detail?id=14519
            this.el.dom.value = this.formatNumberForDisplay(this.el.dom.value, this.getValue());
            */
            Sage.Platform.Mobile.Controls.PhoneField.superclass.onKeyUp.apply(this, arguments);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('phone', Sage.Platform.Mobile.Controls.PhoneField);
})();