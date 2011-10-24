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
        notificationTrigger: false,
        validationTrigger: false,
		inputType: 'text',
        enableClearButton: true,
        validInputOnly: false,
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
                '<button class="clear-button" data-dojo-attach-event="onclick:onClearPress"></button>',
            '{% } %}',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onkeyup: onKeyUp, onblur: onBlur, onfocus: onFocus" class="text-input" type="{%: $.inputType %}" name="{%= $.name %}" {% if ($.readonly) { %} readonly {% } %}>'
        ]),
        init: function() {
            if (this.validInputOnly)
                dojo.connect(this.inputNode, 'onkeypress', this, this.onKeyPress);
            this.inherited(arguments);
        },
        enable: function() {
            this.inherited(arguments);
            dojo.attr(this.inputNode, 'disabled', false);
        },
        disable: function() {
            this.inherited(arguments);
            dojo.attr(this.inputNode, 'disabled', true);
        },  
        onKeyPress: function(evt) {
            var v = this.getValue() + String.fromCharCode(evt.getCharCode());
            if (this.validate(v))
            {
                dojo.stopEvent(evt);
                return false;
            }            
        },
        onKeyUp: function(evt) {
            if (this.validationTrigger == 'keyup')
                this.onValidationTrigger(evt);

            if (this.notificationTrigger == 'keyup')
                this.onNotificationTrigger(evt);
        },
        onFocus: function(evt){
            dojo.addClass(this.domNode, 'text-field-active');
        },
        onBlur: function(evt) {
            var scope = this;

            if (this.validationTrigger == 'blur')
                this.onValidationTrigger(evt);

            if (this.notificationTrigger == 'blur')
                this.onNotificationTrigger(evt);

            setTimeout(function(){
                if(document.activeElement !== scope.inputNode)
                    dojo.removeClass(scope.domNode, 'text-field-active');
            }, 100);
        },
        onClearPress: function(evt){
            this.clearValue();
            dojo.stopEvent(evt);
            // Mobile browsers listen to either or both events to show keyboard
            this.inputNode.focus();
            this.inputNode.click();
        },
        onNotificationTrigger: function(evt) {
            var currentValue = this.getValue();

            if (this.previousValue != currentValue)
                this.change(currentValue);

            this.previousValue = currentValue;
        },
        onValidationTrigger: function(evt) {
            if (this.validate())
                this.containerNode.addClass('row-error');
            else
                this.containerNode.removeClass('row-error');
        },
        getValue: function() {
            return this.inputNode.value;
        },
        setValue: function(val, initial) {
            if (initial) this.originalValue = val;

            this.previousValue = false;

            this.set('inputValue', val);
        },
        clearValue: function() {
            this.setValue('', true);
        },
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });

    return Sage.Platform.Mobile.FieldManager.register('text', control);
});