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

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.TextField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {        
        notificationTrigger: false,
        validationTrigger: false,
		inputType: 'text',
        clearBox: true,
        attachmentPoints: {
            clearEl: '.clear-button'
        },
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '{% if($.clearBox) { %}',
                '<span class="clear-button"></span>',
            '{% } %}',
            '<input class="text-input" type="{%: $.inputType %}" name="{%= $.name %}" {% if ($.readonly) { %} readonly {% } %}>'
        ]),
        init: function() {
            if (this.validInputOnly)
                this.el.on('keypress', this.onKeyPress, this);

            this.el
                .on('keyup', this.onKeyUp, this)
                .on('blur', this.onBlur, this)
                .on('focus', this.onFocus, this);
        },
        renderTo: function(){
            Sage.Platform.Mobile.Controls.EditorField.superclass.renderTo.apply(this, arguments);
            if(this.clearBox && this.clearEl)
                this.clearEl.on('click', this.onClearPress, this);
        },
        enable: function() {
            Sage.Platform.Mobile.Controls.EditorField.superclass.enable.apply(this, arguments);

            this.el.dom.disabled = false;
        },
        disable: function() {
            Sage.Platform.Mobile.Controls.EditorField.superclass.disable.apply(this, arguments);

            this.el.dom.disabled = true;
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
            
            if(this.clearBox && this.clearEl) {
                if(!this.clearEl.isVisible() && this.getValue())
                    this.clearEl.show(true);
                else if (!this.getValue())
                    this.clearEl.hide(true);
            }
        },
        onFocus: function(evt, el, o){
            if(this.clearBox && this.clearEl && !this.clearEl.isVisible() && this.getValue())
                this.clearEl.show(true);
        },
        onBlur: function(evt, el, o) {
            if (this.validationTrigger == 'blur')
                this.onValidationTrigger(evt, el, o);

            if (this.notificationTrigger == 'blur')
                this.onNotificationTrigger(evt, el, o);

            if(this.clearBox) {
                // fix for mobile event handling
                var scope = this;
                setTimeout(function(){
                    scope.clearEl.hide(true);
                }, 250);
            }
        },
        onClearPress: function(evt){
            this.clearValue();
            this.clearEl.hide(true);
            this.el.focus();
        },
        onNotificationTrigger: function(evt, el, o) {
            var currentValue = this.getValue();

            if (this.previousValue != currentValue)
                this.fireEvent('change', currentValue, this);

            this.previousValue = currentValue;
        },
        onValidationTrigger: function(evt, el, o) {
            if (this.validate())
                this.containerEl.addClass('row-error');
            else
                this.containerEl.removeClass('row-error');
        },
        getValue: function() {
            return this.el.getValue();
        },
        setValue: function(val, initial) {
            if (initial) this.originalValue = val;

            this.previousValue = false;

            this.el.dom.value = val || '';
        },
        clearValue: function() {
            this.setValue('', true);
        },
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('text', Sage.Platform.Mobile.Controls.TextField);
})();