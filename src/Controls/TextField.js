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
    dojo.declare('Sage.Platform.Mobile.Controls.TextField', [Sage.Platform.Mobile.Controls.Field], {
        notificationTrigger: false,
        validationTrigger: false,
		inputType: 'text',
        enableClearButton: true,
        validInputOnly: false,
        clearAnimation: {},
        attributeMap: {
            clearNode: {node: 'clearNode', type: 'innerHTML'}
        },
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '{% if($.enableClearButton) { %}',
                '<button class="clear-button" dojoAttachPoint="clearNode"></button>',
            '{% } %}',
            '<input dojoAttachPoint="inputNode" class="text-input" type="{%: $.inputType %}" name="{%= $.name %}" {% if ($.readonly) { %} readonly {% } %}>'
        ]),
        init: function() {
            if (this.validInputOnly)
                dojo.connect(this.inputNode, 'onkeypress', this.onKeyPress);

            dojo.connect(this.inputNode, 'onkeyup', this.onKeyUp);
            dojo.connect(this.inputNode, 'onblur', this.onBlur);
            dojo.connect(this.inputNode, 'onfocus', this.onFocus);
        },
        renderTo: function(){
            this.inherited(arguments);
            if(this.enableClearButton && this.clearNode)
                this.clearNode.on('click', this.onClearPress, this);
        },
        enable: function() {
            this.inherited(arguments);
            this.inputNode.disabled = false;
        },
        disable: function() {
            this.inherited(arguments);
            this.inputNode.disabled = true;
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
                dojo.attr(this.clearNode,'visibility','visible');
            }
        },
        onBlur: function(evt, el, o) {
            if (this.validationTrigger == 'blur')
                this.onValidationTrigger(evt, el, o);

            if (this.notificationTrigger == 'blur')
                this.onNotificationTrigger(evt, el, o);

            if(this.enableClearButton && this.clearNode) {
                dojo.attr(this.clearNode,'visibility','hidden');
                /*
                // fix for mobile event handling
                var scope = this;
                setTimeout(function(){
                    if(!(scope.inputNode == document.activeElement)) {
                        scope.clearNode.hide(scope.clearAnimation);
                    }
                }, 150);
                */
            }
        },
        onClearPress: function(evt){
            this.clearValue();
            this.inputNode.focus();
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
            return this.inputNode.getValue();
        },
        setValue: function(val, initial) {
            if (initial) this.originalValue = val;

            this.previousValue = false;

            this.inputNode.value = val || '';
        },
        clearValue: function() {
            this.setValue('', true);
        },
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('text', Sage.Platform.Mobile.Controls.TextField);
});