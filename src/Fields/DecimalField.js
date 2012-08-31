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


define('Sage/Platform/Mobile/Fields/DecimalField', [
    'dojo/_base/declare',
    'dojo/string',
    'Sage/Platform/Mobile/Fields/TextField',
    'Sage/Platform/Mobile/FieldManager'
], function(
    declare,
    string,
    TextField,
    FieldManager
) {
    /**
     * The Decimal Field is used for inputting numbers and extends {@link TextField TextField} with:
     *
     * * hides the clear (x) button;
     * * when setting a value, it converts the decimal and thousands group separator to the localized versions; and
     * * when getting a value, it back-converts the localized punctuation into the en-US format and converts the result into a float (Number).
     *
     * ###Example:
     *     {
     *         name: 'SalesPotential',
     *         property: 'SalesPotential',
     *         label: this.salesPotentialText,
     *         type: 'decimal'
     *     }
     *
     * @alternateClassName DecimalField
     * @extends TextField
     * @requires FieldManager
     */
    var control = declare('Sage.Platform.Mobile.Fields.DecimalField', [TextField], {
        /**
         * @cfg {Number}
         * Defines how many decimal places to format when setting the value.
         */
        precision: 2,
        /**
         * @property {Boolean}
         * Disables the display of the clear (x) button inherited from {@link TextField TextField}.
         */
        enableClearButton: false,
        /**
         * Before calling the {@link TextField#setValue parent implementation} it parses the value
         * via `parseFloat`, trims the decimal place and then applies localization for the decimal
         * and thousands punctuation.
         * @param {Number/String} val Value to be set
         */
        setValue: function(val) {
            val = parseFloat(val).toFixed(this.precision || Mobile.CultureInfo.numberFormat.currencyDecimalDigits);
            val = isNaN(val)
                ? string.substitute('0${0}00', [Mobile.CultureInfo.numberFormat.currencyDecimalSeparator || '.'])
                : string.substitute('${0}${1}${2}',
                    [
                        parseInt(val, 10),
                        Mobile.CultureInfo.numberFormat.currencyDecimalSeparator || '.',
                        val.substr(- Mobile.CultureInfo.numberFormat.currencyDecimalDigits)
                    ]);

            this.inherited(arguments, [val]);
        },
        /**
         * Retrieves the value from the {@link TextField#getValue parent implementation} but before
         * returning it de-converts the punctuation back to `en-US` format.
         * @return {Number}
         */
        getValue: function() {
            var value = this.inherited(arguments);
            // SData (and other functions) expect American formatted numbers
            value = value
                .replace(Mobile.CultureInfo.numberFormat.currencyGroupSeparator, '')
                .replace(Mobile.CultureInfo.numberFormat.numberGroupSeparator, '')
                .replace(Mobile.CultureInfo.numberFormat.currencyDecimalSeparator, '.')
                .replace(Mobile.CultureInfo.numberFormat.numberDecimalSeparator, '.');
            return parseFloat(value);
        }
    });

    return FieldManager.register('decimal', control);
});