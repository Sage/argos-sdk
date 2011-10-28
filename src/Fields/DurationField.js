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

define('Sage/Platform/Mobile/Fields/DurationField', ['Sage/Platform/Mobile/Fields/LookupField', 'Sage/Platform/Mobile/Format', 'localization/en'], function() {
    var control = dojo.declare('Sage.Platform.Mobile.Fields.DurationField', [Sage.Platform.Mobile.Fields.LookupField], {
        // Localization
        emptyText: '',
        invalidDateFormatErrorText: "Field '${0}' is not a valid duration.",
        autoCompleteText: {
            'minute(s)': 1,
            'hour(s)': 60,
            'day(s)': 1440,
            'week(s)': 10080
        },

        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button simpleSubHeaderButton" data-dojo-attach-event="onclick:navigateToListView" aria-label="{%: $.lookupLabelText %}"><span aria-hidden="true">{%: $.lookupText %}</span></button>',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onkeyup: onKeyUp, onblur: onBlur, onfocus: onFocus" class="text-input" type="{%: $.inputType %}" name="{%= $.name %}" {% if ($.readonly) { %} readonly {% } %}>',
            '<div class="autoComplete-watermark" data-dojo-attach-point="autoCompleteNode"></div>'
        ]),
        attributeMap: {
            inputValue: {
                node: 'inputNode',
                type: 'attribute',
                attribute: 'value'
            },
            autoCompleteContent: {
                node: 'autoCompleteNode',
                type: 'attribute',
                attribute: 'innerHTML'
            }
        },

        valueKeyProperty: false,
        valueTextProperty: false,
        currentKey: null,
        currentValue: 0,
        /**
         * The first capture group must be non-text part
         * Second capture is the phrase to be used in auto complete
         */
        autoCompletePhraseRE: new RegExp([
                    '^((?:\\d+(?:\\',
                    Mobile.CultureInfo.numberFormat.numberDecimalSeparator,
                    '\\d*)?|\\',
                    Mobile.CultureInfo.numberFormat.numberDecimalSeparator,
                    '\\d+)\\s*?)(\\w+)'
                ].join('')),
        /**
         * Only one capture which should correlate to the value portion
         */
        autoCompleteValueRE: new RegExp([
                    '^((?:\\d+(?:\\',
                    Mobile.CultureInfo.numberFormat.numberDecimalSeparator,
                    '\\d*)?|\\',
                    Mobile.CultureInfo.numberFormat.numberDecimalSeparator,
                    '\\d+))'
                ].join('')),
        init: function() {
            // do not use lookups connects
        },
        onKeyUp: function(evt){
            var val = this.inputNode.value.toString(),
                match = this.autoCompletePhraseRE.exec(val);
            if(!match || val.length < 1) {
                this.hideAutoComplete();
                return true;
            }
            for(var key in this.autoCompleteText){
                if(this.isWordMatch(match[2], key)){
                    this.currentKey = key;
                    this.showAutoComplete(match[1]+key);
                    return true;
                }
            }
            this.hideAutoComplete();
        },
        isWordMatch: function(val, word){
            if (val.length > word.length)
                val = val.slice(0, word.length);
            else
                word = word.slice(0, val.length);
            return val.toUpperCase() === word.toUpperCase();
        },
        showAutoComplete: function(word){
            this.set('autoCompleteContent', word);
        },
        hideAutoComplete: function(){
            this.set('autoCompleteContent', '');
        },
        onBlur: function(evt){
            var val = this.inputNode.value.toString(),
                match = this.autoCompleteValueRE.exec(val),
                multiplier = this.autoCompleteText[this.currentKey],
                newValue = 0;
            if(!match || val.length < 1) {
                return true;
            }
            newValue = parseFloat(match[0],10) * multiplier;
            this.setValue(newValue);
        },
        getValue: function(){
            return this.currentValue;
        },
        setValue: function(val, init){
            this.currentValue = val;
            this.set('inputValue', this.textFormat(val));
            this.hideAutoComplete();
        },
        setSelection: function(val, key){
            this.setValue(parseFloat(key, 10));
        },
        textFormat: function(val){
            var stepValue,
                finalUnit = 1,
                autoCompleteValues = this.autoCompleteText;
            for(var key in autoCompleteValues){
                stepValue = autoCompleteValues[key];
                if(val / stepValue >= 1){
                    finalUnit = stepValue;
                    this.currentKey = key;
                }
            }
            return this.convertUnit(val, finalUnit)+' '+this.currentKey;
        },
        convertUnit: function(val, to){
            return Sage.Platform.Mobile.Format.fixed(val/to, 2);
        },
        createNavigationOptions: function() {
            var options = this.inherited(arguments);
            options.data = this.expandExpression(this.data);
            return options;
        },
        validate: function() {
        }
    });
    
    return Sage.Platform.Mobile.FieldManager.register('duration', control);
});