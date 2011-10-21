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

define('Sage/Platform/Mobile/Controls/TextField', ['Sage/Platform/Mobile/Controls/Field'], function() {
    var control = dojo.declare('Sage.Platform.Mobile.Controls.TextField', [Sage.Platform.Mobile.Controls.Field], {
        notificationTrigger: false,
        validationTrigger: false,
		inputType: 'text',
        enableClearButton: true,
        validInputOnly: false,
        clearNodeHiding: false,
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
                '<button class="clear-button" data-dojo-attach-point="clearNode" data-dojo-attach-event="onclick: onClearPress"></button>',
            '{% } %}',
            '<input data-dojo-attach-point="inputNode" class="text-input" type="{%: $.inputType %}" name="{%= $.name %}" {% if ($.readonly) { %} readonly {% } %}>'
        ]),
        init: function() {
            if (this.validInputOnly)
                dojo.connect(this.inputNode, 'onkeypress', this, this.onKeyPress);

            dojo.connect(this.inputNode, 'onkeyup', this, this.onKeyUp);
            dojo.connect(this.inputNode, 'onblur', this, this.onBlur);
            dojo.connect(this.inputNode, 'onfocus', this, this.onFocus);
        },
        renderTo: function(){
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
        onKeyPress: function(evt, el, o) {
            var v = this.getValue() + String.fromCharCode(evt.getCharCode());
            if (this.validate(v))
            {
                evt.stopEvent();
                return;
            }            
        },
        onKeyUp: function(evt, el, o) {
            if (this.validationTrigger == 'keyup')
                this.onValidationTrigger(evt, el, o);

            if (this.notificationTrigger == 'keyup')
                this.onNotificationTrigger(evt, el, o);
        },
        onFocus: function(evt, el, o){
            if(this.enableClearButton && this.clearNode){
                dojo.style(this.clearNode, 'visibility', 'visible');
            }
        },
        onBlur: function(evt, el, o) {
            var scope = this;

            if (this.validationTrigger == 'blur')
                this.onValidationTrigger(evt, el, o);

            if (this.notificationTrigger == 'blur')
                this.onNotificationTrigger(evt, el, o);

            if(this.enableClearButton && this.clearNode) {
                if(!this.clearNodeHiding) {
                    this.clearNodeHiding = true;
                    setTimeout(function(){
                        if(scope.inputNode != document.activeElement) {
                            dojo.style(scope.clearNode, 'visibility', 'hidden');
                        }
                        scope.clearNodeHiding = false;
                    }, 100);
                }
            }
        },
        onClearPress: function(evt){
            this.clearValue();
            dojo.stopEvent(evt);
            // Mobile browsers listen to either or both events
            // to show keyboard
            this.inputNode.focus();
            this.inputNode.click();
        },
        onNotificationTrigger: function(evt, el, o) {
            var currentValue = this.getValue();

            if (this.previousValue != currentValue)
                this.change(currentValue);

            this.previousValue = currentValue;
        },
        onValidationTrigger: function(evt, el, o) {
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

    Sage.Platform.Mobile.Controls.FieldManager.register('text', Sage.Platform.Mobile.Controls.TextField);
    return control;
});