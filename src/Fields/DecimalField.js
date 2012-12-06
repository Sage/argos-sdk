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
 * Note that this requires `Mobile.CultureInfo` to be set with required top level localization values.
 *
 * @alternateClassName DecimalField
 * @extends TextField
 */
define('argos/Fields/DecimalField', [
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
    return declare('argos.Fields.DecimalField', [TextField], {
        /**
         * @property {Simplate}
         * Overrides the Simplate that defines the fields HTML Markup to add more event handlers and attributes for HTML5
         * nuumber type like `step`
         *
         * * `$` => Field instance
         * * `$$` => Owner View instance
         *
         */
        widgetTemplate: new Simplate([
            '<div>',
            '{% if ($.enableClearButton && !$.readonly) { %}',
            '<button class="clear-button" data-dojo-attach-point="clearNode" data-dojo-attach-event="onclick:_onClearClick"></button>',
            '{% } %}',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onkeyup: _onKeyUp, onblur: _onBlur, onfocus: _onFocus, onmouseup: _onMouseUp" class="text-input" type="{%= $.inputType %}" placeholder="{%: $.placeHolder %}" name="{%= $.name %}" step="any" {% if ($.readonly) { %} readonly {% } %}>',
            '</div>'
        ]),

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
         * @property {String}
         * Overrides the `<input type=` to be the HTML5 `'number'` type. This provides a numerical keyboard on mobile.
         */
        inputType: 'number',

        /**
         * Before calling the {@link TextField#setValue parent implementation} it parses the value
         * via `parseFloat`, trims the decimal place and then applies localization for the decimal
         * and thousands punctuation.
         * @param {Number/String} val Value to be set
         */
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
        /**
         * Handler when the field receives focus.
         *
         * Creates a selection range on the current inputted value.
         *
         * @param {Event} evt Focus event
         * @private
         */
        _onFocus: function(evt) {
            this.inherited(arguments);
            // ios does not support .select(), using suggested https://developer.mozilla.org/en/DOM/Input.select
            evt.target.setSelectionRange(0, 9999);
        },
        /**
         * Handler for the fields onmouseup event.
         *
         * Since we are creating a selection on focus some browsers fire that event before mouseup and thereby
         * deselect our selection. This prevents the event.
         *
         * @param {Event} evt Mouse up event
         * @private
         */
        _onMouseUp: function(evt) {
            this.inherited(arguments);
            event.stop(evt); // prevent de-selecting focused text
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
});