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
    'dojo/_base/event',
    'dojo/string',
    './TextField'
], function(
    declare,
    event,
    string,
    TextField
) {
    return declare('Sage.Platform.Mobile.Fields.DecimalField', [TextField], {
        widgetTemplate: new Simplate([
            '<div>',
            '{% if ($.enableClearButton && !$.readonly) { %}',
            '<button class="clear-button" data-dojo-attach-point="clearNode" data-dojo-attach-event="onclick:_onClearClick"></button>',
            '{% } %}',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onkeyup: _onKeyUp, onblur: _onBlur, onfocus: _onFocus, onmouseup: _onMouseUp" class="text-input" type="{%= $.inputType %}" name="{%= $.name %}" step="any" {% if ($.readonly) { %} readonly {% } %}>',
            '</div>'
        ]),

        precision: 2,
        enableClearButton: false,
        inputType: 'number',

        setValue: function(val, initial) {
            if (isNaN(parseFloat(val)))
                val = 0;

            var precision = (isNaN(this.precision) || this.precision < 0)
                ? Mobile.CultureInfo.numberFormat.currencyDecimalDigits
                : this.precision;
            val = parseFloat(val).toFixed(precision);

            val = val.replace('.', Mobile.CultureInfo.numberFormat.currencyDecimalSeparator);

            this.inherited(arguments, [val, initial]);
        },
        _onFocus: function(evt) {
            this.inherited(arguments);
            // ios does not support .select(), using suggested https://developer.mozilla.org/en/DOM/Input.select
            evt.target.setSelectionRange(0, 9999);
        },
        _onMouseUp: function(evt) {
            this.inherited(arguments);
            event.stop(evt); // prevent de-selecting focused text
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