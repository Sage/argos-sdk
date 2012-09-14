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

define('Sage/Platform/Mobile/Fields/DurationField', [
    'dojo/_base/declare',
    'dojo/string',
    'dojo/dom-class',
    'Sage/Platform/Mobile/Format',
    'Sage/Platform/Mobile/Fields/LookupField',
    'Sage/Platform/Mobile/FieldManager'
], function(
    declare,
    string,
    domClass,
    format,
    LookupField,
    FieldManager
) {
    /**
     * The Duration field is a mashup of an auto-complete box and a {@link LookupField LookupField} for handling
     * duration's of: minutes, hours, days, weeks or years. Meaning a user can type directly into the input area the
     * amount of time or press the lookup button and choose from pre-determined list of times.
     *
     * When typing in a value directly, the Duration field only supports one "measurement" meaning if you wanted to
     * have 1 hour and 30 minutes you would need to type in 90 minutes or 1.5 hours.
     *
     * The auto-complete happens on blur, so if a user types in 5m they would need to go to the next field (or press
     * Save) and the field will auto-complete to 5 minute(s), letting the user know it accepted the value. If a value
     * entered is not accepted, 5abc, it will default to the last known measurement, defaulting to minutes.
     *
     * Setting and getting the value is always in minutes as a Number.
     *
     * ###Example:
     *     {
     *         name: 'Duration',
     *         property: 'Duration',
     *         label: this.durationText,
     *         type: 'duration',
     *         view: 'durations_list'
     *     }
     *
     * @alternateClassName DurationField
     * @extends LookupField
     * @requires FieldManager
     */
    var control = declare('Sage.Platform.Mobile.Fields.DurationField', [LookupField], {
        /**
         * Maps various attributes of nodes to setters.
         */
        attributeMap: {
            inputValue: {
                node: 'inputNode',
                type: 'attribute',
                attribute: 'value'
            },
            inputDisabled: {
                node: 'inputNode',
                type: 'attribute',
                attribute: 'disabled'
            },
            autoCompleteContent: {
                node: 'autoCompleteNode',
                type: 'attribute',
                attribute: 'innerHTML'
            }
        },
        /**
         * @property {Simplate}
         * Simplate that defines the fields HTML Markup
         *
         * * `$` => Field instance
         * * `$$` => Owner View instance
         *
         */
        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<div class="autoComplete-watermark" data-dojo-attach-point="autoCompleteNode"></div>',
            '<button class="button simpleSubHeaderButton" data-dojo-attach-event="onclick:navigateToListView" aria-label="{%: $.lookupLabelText %}"><span aria-hidden="true">{%: $.lookupText %}</span></button>',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onkeyup: _onKeyUp, onblur: _onBlur, onfocus: _onFocus" class="text-input" type="{%: $.inputType %}" name="{%= $.name %}" {% if ($.readonly) { %} readonly {% } %}>'
        ]),

        // Localization
        /**
         * @property {String}
         * Text used when no value or null is set to the field
         */
        emptyText: '',
        /**
         * @property {String}
         * Text displayed when an invalid input is detected
         */
        invalidDurationErrorText: "Field '${0}' is not a valid duration.",
        /**
         * @property {Object}
         * The auto completed text and their corresponding values in minutes (SData is always minutes)
         *
         * Override ride this object to change the autocomplete units or their localization.
         */
        autoCompleteText: {
            1 : 'minute(s)',
            60 : 'hour(s)',
            1440 : 'day(s)',
            10080 : 'week(s)',
            525960 : 'year(s)'
        },
        /**
         * @property {Boolean}
         * Overrides the {@link LookupField LookupField} default to explicitly set it to false forcing
         * the view to use the currentValue instead of a key/descriptor
         */
        valueKeyProperty: false,
        /**
         * @property {Boolean}
         * Overrides the {@link LookupField LookupField} default to explicitly set it to false forcing
         * the view to use the currentValue instead of a key/descriptor
         */
        valueTextProperty: false,

        /**
         * @property {String}
         * The current unit as detected by the parser
         * @private
         */
        currentKey: null,
        /**
         * @property {Number}
         * The current value, expressed as minutes.
         */
        currentValue: 0,

        /**
         * @property {RegExp}
         * Regular expression for capturing the phrase (text).
         *
         * The first capture group must be non-text part
         * Second capture is the phrase to be used in auto complete
         */
        autoCompletePhraseRE: /^((?:\d+(?:\.\d*)?|\.\d+)\s*?)(\w+)/,

        /**
         * @property {RegExp}
         * Regular expression for capturing the value.
         * Only one capture which should correlate to the value portion
         */
        autoCompleteValueRE: /^((?:\d+(?:\.\d*)?|\.\d+))/,

        /**
         * Overrides the parent to skip the connections and alter the base capture RegExp's to account for localization
         */
        init: function() {
            // do not use lookups connects

            var numberDecimalSeparator = Mobile.CultureInfo.numberFormat.numberDecimalSeparator;

            this.autoCompletePhraseRE = new RegExp(
                string.substitute('^((?:\\d+(?:\\${0}\\d*)?|\\${0}\\d+)\\s*?)(\\w+)', [numberDecimalSeparator])
            );

            this.autoCompleteValueRE = new RegExp(
                string.substitute('^((?:\\d+(?:\\${0}\\d*)?|\\${0}\\d+))', [numberDecimalSeparator])
            );
        },
        /**
         * Handler for onkeyup on the input. The logic for comparing the matched value and phrase to the autocomplete
         * is done here.
         * @param {Event} evt onkeyup
         * @private
         */
        _onKeyUp: function(evt) {
            var val = this.inputNode.value.toString(),
                match = this.autoCompletePhraseRE.exec(val);

            if (!match || val.length < 1)
            {
                this.hideAutoComplete();
                return true;
            }

            for (var key in this.autoCompleteText)
            {
                if (this.isWordMatch(match[2], this.autoCompleteText[key]))
                {
                    this.currentKey = this.autoCompleteText[key];
                    this.showAutoComplete(match[1] + this.autoCompleteText[key]);
                    return true;
                }
            }

            this.hideAutoComplete();
        },
        /**
         * Determines if the two provided values are the same word, ignoring capitalization and length:
         *
         * * h, hour(s) = true
         * * hou, hour(s) = true
         * * minn, minute(s) = false
         * * year, year(s) = true
         *
         * @param {String} val First string to compare
         * @param {String} word Second string to compare
         * @return {Boolean} True if they are equal.
         */
        isWordMatch: function(val, word) {
            if (val.length > word.length)
                val = val.slice(0, word.length);
            else
                word = word.slice(0, val.length);

            return val.toUpperCase() === word.toUpperCase();
        },
        /**
         * Shows the auto-complete version of the phrase
         * @param {String} word Text to put in the autocomplete
         */
        showAutoComplete: function(word) {
            this.set('autoCompleteContent', word);
        },
        /**
         * Clears the autocomplete input
         */
        hideAutoComplete: function() {
            this.set('autoCompleteContent', '');
        },
        /**
         * Inputs onblur handler, if an auto complete is matched it fills the text out the full text
         * @param evt
         * @return {Boolean}
         * @private
         */
        _onBlur: function(evt) {
            var val = this.inputNode.value.toString(),
                match = this.autoCompleteValueRE.exec(val),
                multiplier = this.getMultiplier(this.currentKey),
                newValue = 0;

            if (val.length < 1) return true;
            if (!match) return true;

            newValue = parseFloat(match[0]) * multiplier;
            this.setValue(newValue);
        },
        /**
         * Returns the corresponding value in minutes to the passed key (currentKey)
         * @return {Number}
         */
        getMultiplier: function(key) {
            var k;
            for (k in this.autoCompleteText) {
                if (this.autoCompleteText.hasOwnProperty(k) && key == this.autoCompleteText[k])
                    break;
            }
            return k;
        },
        /**
         * Returns the current value in minutes
         * @return {Number}
         */
        getValue: function(){
            return this.currentValue;
        },
        /**
         * Sets the currentValue to the passed value, but sets the displayed value after formatting with {@link #textFormat textFormat}.
         * @param {Number} val Number of minutes
         * @param init
         */
        setValue: function(val, init) {
            this.currentValue = val;
            this.set('inputValue', this.textFormat(val));
            this.hideAutoComplete();
        },
        /**
         * If used as a Lookup, this is invoked with the value of the lookup item.
         * @param val
         * @param {String/Number} key Number of minutes (will be converted via parseFloat)
         */
        setSelection: function(val, key) {
            this.setValue(parseFloat(key));
        },
        /**
         * Takes the number of minutes and converts it into a textual representation using the `autoCompleteText`
         * collection as aguide
         * @param {Number} val Number of minutes
         * @return {String}
         */
        textFormat: function(val) {
            var stepValue,
                finalUnit = 1,
                autoCompleteValues = this.autoCompleteText;

            for (var key in autoCompleteValues)
            {
                stepValue = key;
                if (val === 0 && stepValue === 1)
                {
                    this.currentKey = autoCompleteValues[key];
                    break;
                }
                if (val / stepValue >= 1)
                {
                    finalUnit = stepValue;
                    this.currentKey = autoCompleteValues[key];
                }
            }
            return this.convertUnit(val, finalUnit) + ' ' +this.currentKey;
        },
        /**
         * Divides two numbers and fixes the decimal point to two places.
         * @param {Number} val
         * @param {Number} to
         * @return {Number}
         */
        convertUnit: function(val, to) {
            return format.fixed(val/to, 2);
        },
        /**
         * Extends the {@link LookupField#createNavigationOptions parent implementation} to explicitly set hide search
         * to true and data to `this.data`.
         * @return {Object} Navigation options object to be passed
         */
        createNavigationOptions: function() {
            var options = this.inherited(arguments);
            options.hideSearch = true;
            options.data = this.expandExpression(this.data);
            return options;
        },
        /**
         * Validets the field by verifying it matches one of the auto complete text.
         * @return {Boolean} False for no-errors, true for error.
         */
        validate: function() {
            var val = this.inputNode.value.toString(),
                phraseMatch = this.autoCompletePhraseRE.exec(val);

            if (!phraseMatch)
            {
               domClass.add(this.containerNode, 'row-error');
               return string.substitute(this.invalidDurationErrorText, [val]);
            }
            else
            {
               domClass.remove(this.containerNode, 'row-error');
               return false;
            }
        }
    });
    
    return FieldManager.register('duration', control);
});