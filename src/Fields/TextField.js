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

define('Sage/Platform/Mobile/Fields/TextField', ['Sage/Platform/Mobile/Fields/_Field'], function() {
    var control = dojo.declare('Sage.Platform.Mobile.Fields.TextField', [Sage.Platform.Mobile.Fields._Field], {
        attributeMap: {
            inputValue: {
                node: 'inputNode',
                type: 'attribute',
                attribute: 'value'
            }
        },
        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '{% if($.enableClearButton) { %}',
                '<button class="clear-button" data-dojo-attach-point="clearNode" data-dojo-attach-event="onclick:_onClearClick"></button>',
            '{% } %}',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onkeyup: _onKeyUp, onblur: _onBlur, onfocus: _onFocus" class="text-input" type="{%: $.inputType %}" name="{%= $.name %}" {% if ($.readonly) { %} readonly {% } %}>'
        ]),
        
        notificationTrigger: false,
        validationTrigger: false,
        inputNode: null,
		inputType: 'text',
        enableClearButton: true,
        validInputOnly: false,

        init: function() {
            this.inherited(arguments);
            
            if (this.validInputOnly) this.connect(this.inputNode, 'onkeypress', this._onKeyPress);
        },
        enable: function() {
            this.inherited(arguments);
            
            dojo.attr(this.inputNode, 'disabled', false);
        },
        disable: function() {
            this.inherited(arguments);

            dojo.attr(this.inputNode, 'disabled', true);
        },
        _onKeyPress: function(evt) {
            var v = this.getValue() + String.fromCharCode(evt.getCharCode());
            if (this.validate(v))
            {
                dojo.stopEvent(evt);
                return false;
            }            
        },
        _onKeyUp: function(evt) {
            if (this.validationTrigger == 'keyup')
                this.onValidationTrigger(evt);

            if (this.notificationTrigger == 'keyup')
                this.onNotificationTrigger(evt);
        },
        _onFocus: function(evt) {
            dojo.addClass(this.domNode, 'text-field-active');
        },
        _onBlur: function(evt) {
            var scope = this;

            if (this.validationTrigger == 'blur')
                this.onValidationTrigger(evt);

            if (this.notificationTrigger == 'blur')
                this.onNotificationTrigger(evt);

            dojo.removeClass(this.domNode, 'text-field-active');
        },
        _onClearClick: function(evt) {
            // only clear if input was already active
            if(!dojo.hasClass(this.domNode, 'text-field-active')){
                this.clearValue(true);
                dojo.stopEvent(evt);
            }

            // Mobile browsers listen to either or both events to show keyboard
            this.inputNode.focus();
            this.inputNode.click();
        },
        onNotificationTrigger: function(evt) {
            var currentValue = this.getValue();

            if (this.previousValue != currentValue)
                this.onChange(currentValue, this);

            this.previousValue = currentValue;
        },
        onValidationTrigger: function(evt) {
            if (this.validate())
                dojo.addClass(this.containerNode, 'row-error');
            else
                dojo.removeClass(this.containerNode, 'row-error');
        },
        getValue: function() {
            return this.inputNode.value;
        },
        setValue: function(val, initial) {
            if (initial) this.originalValue = val;

            this.previousValue = false;

            this.set('inputValue', val);
        },
        clearValue: function(asDirty) {
            var initial = asDirty !== true;

            this.setValue('', initial);
        },
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });

    return Sage.Platform.Mobile.FieldManager.register('text', control);
});