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
    './TextField'
], function(
    declare,
    string,
    TextField
) {
    return declare('Sage.Platform.Mobile.Fields.DecimalField', [TextField], {
        precision: 2,
        enableClearButton: false,
        setValue: function(val) {
            if (isNaN(parseFloat(val)))
                val = 0;

            var precision = (isNaN(this.precision) || this.precision < 0)
                ? Mobile.CultureInfo.numberFormat.currencyDecimalDigits
                : this.precision;
            val = parseFloat(val).toFixed(precision);

            val = val.replace('.', Mobile.CultureInfo.numberFormat.currencyDecimalSeparator);

            this.inherited(arguments, [val]);
        },
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
});