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

define('Sage/Platform/Mobile/Controls/DecimalField', ['Sage/Platform/Mobile/Controls/TextField'], function() {
    var control = dojo.declare('Sage.Platform.Mobile.Controls.DecimalField', [Sage.Platform.Mobile.Controls.TextField], {
        precision: 2,
        enableClearButton: false,
        setValue: function(val) {
            val = parseFloat(val, 10).toFixed(this.precision || Mobile.CultureInfo.numberFormat.currencyDecimalDigits);
            val = isNaN(val)
                ? dojo.string.substitute('0${0}00', [Mobile.CultureInfo.numberFormat.currencyDecimalSeparator || '.'])
                : val;
            Sage.Platform.Mobile.Controls.DecimalField.superclass.setValue.call(this, val);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('decimal', Sage.Platform.Mobile.Controls.DecimalField);
    return control;
});