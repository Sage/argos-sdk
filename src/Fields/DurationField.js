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

define('Sage/Platform/Mobile/Fields/DurationField', ['Sage/Platform/Mobile/Fields/_Field', 'Sage/Platform/Mobile/Format'], function() {
    var control = dojo.declare('Sage.Platform.Mobile.Fields.DurationField', [Sage.Platform.Mobile.Fields._Field], {
        // Localization
        emptyText: '',
        invalidDateFormatErrorText: "Field '${0}' is not a valid number.",

        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onchange: onChange" type="text" />',
            '{%! $.selectTemplate %}'
        ]),
        selectTemplate: new Simplate([
            '<select data-dojo-attach-point="selectNode" data-dojo-attach-event="onchange: onSelectChange">',
            '{% for(var key in $.durationMultiplierText) { %}',
                '<option value="{%: key %}">',
                    '{%: $.durationMultiplierText[key] %}',
                '</option>',
            '{% } %}',
            '</select>'
        ]),
        attributeMap: {
            inputContent: {
                node: 'inputNode',
                type: 'attribute',
                attribute: 'value'
            },
            selectContent: {
                node: 'selectNode',
                type: 'attribute',
                attribute: 'value'
            }
        },
        durationMultiplierText: {
            '1': 'minute(s)',
            '60': 'hour(s)',
            '1440': 'day(s)'
        },
        currentValue: null,
        selectNode: null,

        getDurationValue: function(){
            return parseFloat(this.selectNode.value, 10) || 0;
        },
        getDuration: function(){
            var units = this.currentValue,
                multiplier = this.getDurationValue();
            return Math.ceil((units * multiplier));
        },
        onSelectChange: function(evt){
            var convertedValue = this.convertUnit(this.currentValue, this.getDurationValue());
            this.setValue(convertedValue);
        },
        getValue: function(){
            return this.getDuration();
        },
        onChange: function(evt) {
            var val = this.getValue();
            if (isNaN(val)) {
                this.validationValue = this.currentValue = null;
                dojo.addClass(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
            } else {
                this.currentValue = parseFloat(this.inputNode.value, 10);
                this.validationValue = this.currentValue;
                dojo.removeClass(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
            }
        },
        convertUnit: function(val, to){
            var converted =  val / to;
            return Sage.Platform.Mobile.Format.fixed(converted, 2);
        },
        setInitialUnit: function(val){
            var initialUnit = 1,
                stepValue;
            for(var key in this.durationMultiplierText){
                stepValue = parseFloat(key, 10);
                if(val / stepValue > 1){
                    val = val / stepValue;
                    initialUnit = stepValue;
                }
            }
            this.set('selectContent', initialUnit);
            return val;
        },
        isDirty: function() {
            return this.originalValue !== this.currentValue;
        },
        clearValue: function() {
            dojo.removeClass(this.containerNode, 'row-error'); // todo: not the right spot for this, add validation eventing
            this.inherited(arguments);
        },
        formatValue: function(val){
            return val || 0;
        },
        setValue: function(val, init){
            if(init) {
                this.currentValue = val;
                val = this.setInitialUnit(val);
            }

            this.set('inputContent', val);
        },
        validate: function() {
            if (this.inputNode.value !== '' && !this.currentValue || this.currentValue < 0)
                return dojo.string.substitute(this.invalidDateFormatErrorText, [this.label]);

            return this.inherited(arguments);
        }
    });
    
    return Sage.Platform.Mobile.FieldManager.register('duration', control);
});