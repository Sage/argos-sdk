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
    'Sage/Platform/Mobile/Fields/TextField',
    'Sage/Platform/Mobile/FieldManager',
    'dojo/_base/sniff'
], function(
    declare,
    has,
    string,
    TextField,
    FieldManager
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
         * @property {Object[]}
         * Array of objects that have the keys `test` and `format` where `test` is a RegExp that
         * matches the phone grouping and `format` is the string format to be replaced.
         *
         * The RegExp may have capture groups but when you are defining the format strings use:
         *
         * * `${0}` - original value
         * * `${1}` - cleaned value
         * * `${2}` - entire match (against clean value)
         * * `${3..n}` - match groups (against clean value)
         *
         * The `clean value` is taking the inputted numbers/text and removing any non-number
         * and non-"x".
         *
         * The three default formatters are:
         * * `nnn-nnnn`
         * * `(nnn)-nnn-nnnn`
         * * `(nnn)-nnn-nnnxnnnn`
         *
         * If you plan to override this value make sure you include the default ones provided.
         *
         */
        formatters: [{
            test: /^\+.*/,
            format: '${0}'
        },{
            test: /^(\d{3})(\d{3,4})$/,
            format: '${3}-${4}'
        },{
            test: /^(\d{3})(\d{3})(\d{2,4})$/, // 555 555 5555
            format: '(${3})-${4}-${5}'
        },{
            test: /^(\d{3})(\d{3})(\d{2,4})([^0-9]{1,}.*)$/, // 555 555 5555x
            format: '(${3})-${4}-${5}${6}'
        },{
            test: /^(\d{11,})(.*)$/,
            format: '${1}'
        }],

        /**
         * @property {String}
         * Sets the `<input type=` of the field.
         *
         * Currently only iOS supports non-numbers when a tel field has a default value: [Bug Report](http://code.google.com/p/android/issues/detail?id=19724).
         */
        inputType: has('safari') ? 'tel' : 'text',

        /**
         * Formats the displayed value (inputNode value) using {@link formatNumberForDisplay formatNumberForDisplay}.
         */
        _onBlur: function() {
            this.inherited(arguments);

            // temporarily added: http://code.google.com/p/android/issues/detail?id=14519
            this.set('inputValue', this.formatNumberForDisplay(this.inputNode.value, this.getValue()));
        },
        /**
         * Gets the value and strips out non-numbers and non-letter `x` before returning unless
         * the value starts with `+` in which it is returned unmodified.
         * @return {String}
         */
        getValue: function() {
            var value = this.inherited(arguments);

            if (/^\+/.test(value)) return value;

            return value.replace(/[^0-9x]/ig, "");
        },
        /**
         * Sets the original value if initial is true and sets the input value to the formatted
         * value using {@link formatNumberForDisplay formatNumberForDisplay}.
         * @param {String/Number} val String to set
         * @param {Boolean} initial True if the value is the original/clean value.
         */
        setValue: function(val, initial) {
            if (initial) this.originalValue = val;
            
            this.previousValue = false;

            this.set('inputValue', this.formatNumberForDisplay(val) || '');
        },
        /**
         * Takes a number, and optional clean version, and tests it against each `formatters`.
         * If a match is found it uses the formatter `format` to substitute the numbers.
         * @param {String} number Original or source value
         * @param {String} clean Cleaned or stripped of non-number, non-letter `x`
         * @return {String}
         */
        formatNumberForDisplay: function(number, clean) {
            if (typeof clean === 'undefined') clean = number;

            for (var i = 0; i < this.formatters.length; i++)
            {
                var formatter = this.formatters[i],
                    match;
                if ((match = formatter.test.exec(clean)))
                {
                    return string.substitute(formatter.format, [number, clean].concat(match));
                }
            }

            return number;
        },
        /**
         * Currently only calls parent implementation due to an [Android Bug](http://code.google.com/p/android/issues/detail?id=14519).
         * @param {Event} evt Keyup event
         */
        _onKeyUp: function(evt) {
            /*
            // temporarily removed: http://code.google.com/p/android/issues/detail?id=14519
            this.set('inputValue', this.formatNumberForDisplay(this.inputNode.value, this.getValue()));
            */
            this.inherited(arguments);
        }
    });

    return FieldManager.register('phone', control);
});