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

define('Sage/Platform/Mobile/Fields/PhoneField', [
    'dojo/_base/declare',
    'dojo/has',
    'dojo/string',
    '../FieldManager',
    './TextField',
    '../Format',
    'dojo/_base/sniff'
], function(
    declare,
    has,
    string,
    FieldManager,
    TextField,
    format,
    sniff
) {
    /**
     * The Phone field is a specialized {@link TextField TextField} that takes a string of numbers
     * and groups them into a phone number on blur or when setting a value directly the value
     * shown to the user gets passed through the
     * {@link #formatNumberForDisplay formatNumberForDisplay} function, while
     * {@link #getValue getValue} will still return an unformatted version.
     *
     * ###Example:
     *     {
     *         name: 'SalesPotential',
     *         property: 'SalesPotential',
     *         label: this.salesPotentialText,
     *         type: 'decimal'
     *     }
     *
     * @alternateClassName PhoneField
     * @extends TextField
     * @requires FieldManager
     */
    var control = declare('Sage.Platform.Mobile.Fields.PhoneField', [TextField], {
        /**
         * @property {String}
         * Sets the `<input type=` of the field.
         *
         * Currently only iOS supports non-numbers when a tel field has a default value: [Bug Report](http://code.google.com/p/android/issues/detail?id=19724).
         */
        inputType: has('safari') ? 'tel' : 'text',

        /**
         * Formats the displayed value (inputNode value) using {@link format.phone format.phone}.
         */
        _onBlur: function() {
            this.inherited(arguments);

            // temporarily added: http://code.google.com/p/android/issues/detail?id=14519
            this.set('inputValue', format.phone(this.inputNode.value));
        },
        /**
         * Gets the value and strips out non-numbers and non-letter `x` before returning unless
         * the value starts with `+` in which it is returned unmodified.
         * @return {String}
         */
        getValue: function() {
            var value = this.inherited(arguments);

            if (/^\+/.test(value)) return value;

            value = format.alphaToPhoneNumeric(value);

            return value.replace(/[^0-9x]/ig, "");
        },
        /**
         * Sets the original value if initial is true and sets the input value to the formatted
         * value using {@link format.phone format.phone}.
         * @param {String/Number} val String to set
         * @param {Boolean} initial True if the value is the original/clean value.
         */
        setValue: function(val, initial) {
            if (initial) this.originalValue = val;
            
            this.previousValue = false;

            this.set('inputValue', format.phone(val) || '');
        },
        /**
         * Currently only calls parent implementation due to an [Android Bug](http://code.google.com/p/android/issues/detail?id=14519).
         * @param {Event} evt Keyup event
         */
        _onKeyUp: function(evt) {
            /*
            // temporarily removed: http://code.google.com/p/android/issues/detail?id=14519
            this.set('inputValue', format.phone(this.inputNode.value, this.getValue()));
            */
            this.inherited(arguments);
        }
    });

    return FieldManager.register('phone', control);
});
