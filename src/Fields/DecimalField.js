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

define('Sage/Platform/Mobile/Fields/DecimalField', ['Sage/Platform/Mobile/Fields/TextField'], function() {
    var control = dojo.declare('Sage.Platform.Mobile.Fields.DecimalField', [Sage.Platform.Mobile.Fields.TextField], {
        precision: 2,
        enableClearButton: false,
        setValue: function(val) {
            val = parseFloat(val, 10).toFixed(this.precision || Mobile.CultureInfo.numberFormat.currencyDecimalDigits);
            val = isNaN(val)
                ? dojo.string.substitute('0${0}00', [Mobile.CultureInfo.numberFormat.currencyDecimalSeparator || '.'])
                : dojo.string.substitute('${0}${1}${2}',
                    [ parseInt(val),
                      Mobile.CultureInfo.numberFormat.currencyDecimalSeparator || '.',
                      val.substr(- Mobile.CultureInfo.numberFormat.currencyDecimalDigits)
                    ]);
            Sage.Platform.Mobile.Fields.DecimalField.superclass.setValue.call(this, val);
        },
        getValue: function(){
            var value = this.inherited(arguments);
            // SData (and other functions) expect American formatted numbers
            value = value
                .replace(Mobile.CultureInfo.numberFormat.currencyGroupSeparator, '')
                .replace(Mobile.CultureInfo.numberFormat.numberGroupSeparator, '')
                .replace(Mobile.CultureInfo.numberFormat.currencyDecimalSeparator, '.')
                .replace(Mobile.CultureInfo.numberFormat.numberDecimalSeparator,   '.');
            return parseFloat(value, 10);
        }
    });

    return Sage.Platform.Mobile.FieldManager.register('decimal', control);
});