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


define('Sage/Platform/Mobile/Fields/TextField', [
    'dojo/_base/declare',
    'dojo/_base/event',
    'dojo/dom-attr',
    'dojo/dom-class',
    'Sage/Platform/Mobile/Fields/_Field',
    'Sage/Platform/Mobile/FieldManager'
], function(
    declare,
    event,
    domAttr,
    domClass,
    _Field,
    FieldManager
) {
    /**
     * The TextField is the base method of inputting just a string that is bound to a `<input type="text">`.
     *
     * It does introduce:
     *
     * * Clear button - adds a small x buton to clear the input
     * * Option to only allow valid input at each keypress
     *
     * ###Example:
     *     {
     *         name: 'LastName',
     *         property: 'LastName',
     *         label: this.lastNameText,
     *         type: 'text',
     *     }
     *
     * @alternateClassName TextField
     * @extends _Field
     * @requires FieldManager
     */
    var control = declare('Sage.Platform.Mobile.Fields.TextField', [_Field], {
        /**
         * @property {Object}
         * Creates a setter map to html nodes, namely:
         *
         * * inputValue => inputNode's value attribute
         */
        attributeMap: {
            inputValue: {
                node: 'inputNode',
                type: 'attribute',
                attribute: 'value'
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
            '{% if ($.enableClearButton && !$.readonly) { %}',
                '<button class="clear-button" data-dojo-attach-point="clearNode" data-dojo-attach-event="onclick:_onClearClick"></button>',
            '{% } %}',
            '<input data-dojo-attach-point="inputNode" data-dojo-attach-event="onkeyup: _onKeyUp, onblur: _onBlur, onfocus: _onFocus" class="text-input" type="{%: $.inputType %}" name="{%= $.name %}" {% if ($.readonly) { %} readonly {% } %}>'
        ]),
        /**
         * @property {HTMLElement}
         * The dojo-attach-point reference to the input element
         */
        inputNode: null,
        /**
         * @property {HTMLElement}
         * The dojo-attach-point reference to the clear button
         */
        clearNode: null,

        /**
         * @cfg {String}
         * Event name for enabling {@link #onNotificationTrigger onNotificationTrigger} function to
         * be called, can be either `keyup` or `blur`. The trigger in turn calls the {@link #onChange onChange} function
         * if the field has been changed.
         */
        notificationTrigger: false,
        /**
         * @cfg {String}
         * Event name for enabling {@link #onValidationTrigger onValidationTrigger} function to
         * be called, can be either `keyup` or `blur`. The trigger in turn validates the field.
         */
        validationTrigger: false,
        /**
         * @cfg {String}
         * The `<input type=` for the field, may be overridden to use the HTML5 enhanced types.
         */
		inputType: 'text',
        /**
         * @cfg {Boolean}
         * Flag for controlling the addition of the clear button.
         */
        enableClearButton: true,
        /**
         * @cfg {Boolean}
         * Flag that if true connects the `onkeypress` event to {@link #_onKeyPress _onKeyPress}
         * where it adds the typed key to the current value and validates the field - if validation
         * fails the key press is cancelled.
         */
        validInputOnly: false,
        /**
         * @property {String}
         * Value storage for detecting changes either via direct input or programmatic setting.
         */
        previousValue: null,
        /**
         * @property {String}
         * Value storage for keeping track of modified/unmodified values. Used in {@link #isDirty isDirty}.
         */
        originalValue: null,


        /**
         * Extends the parent implementation to optionally bind the `onkeypress` event if `validInputOnly`
         * is true.
         */
        init: function() {
            this.inherited(arguments);
            
            if (this.validInputOnly)
                this.connect(this.inputNode, 'onkeypress', this._onKeyPress);
        },
        /**
         * Extends the parent implementation to set the disabled attribute of the input to false
         */
        enable: function() {
            this.inherited(arguments);
            
            domAttr.set(this.inputNode, 'disabled', false);
        },
        /**
         * Extends the parent implementation to set the disabled attribute of the input to true
         */
        disable: function() {
            this.inherited(arguments);

            domAttr.set(this.inputNode, 'disabled', true);
        },
        /**
         * Handler for the `onkeypress` event which is not connected unless `validInputOnly` is true.
         *
         * Since this is a direct tie-in for `validInputOnly`, this intercepts the key press, adds it
         * to the current value temporarily and validates the result -- if it validates the key press is
         * accepted, if validation fails the key press is rejected and the key is not entered.
         * @param {Event} evt
         */
        _onKeyPress: function(evt) {
            var v = this.getValue() + evt.keyChar;
            if (this.validate(v))
            {
                event.stop(evt);
                return false;
            }            
        },
        /**
         * Handler for the `onkeyup` event.
         *
         * If either the `validationTrigger` or `notificationTrigger` is set to `keyup` then it will fire
         * the respective function.
         *
         * @param {Event} evt
         */
        _onKeyUp: function(evt) {
            if (this.validationTrigger == 'keyup')
                this.onValidationTrigger(evt);

            if (this.notificationTrigger == 'keyup')
                this.onNotificationTrigger(evt);
        },
        /**
         * Handler for the `onfocus` event.
         *
         * Adds the active styling which is used for detecting state in the clear button click handler.
         *
         * @param evt
         */
        _onFocus: function(evt) {
            domClass.add(this.domNode, 'text-field-active');
        },
        /**
         * Handler for the `onblur` event
         *
         * If either the `validationTrigger` or `notificationTrigger` is set to `blur` then it will fire
         * the respective function.
         *
         * @param {Event} evt
         */
        _onBlur: function(evt) {
            if (this.validationTrigger == 'blur')
                this.onValidationTrigger(evt);

            if (this.notificationTrigger == 'blur')
                this.onNotificationTrigger(evt);

            domClass.remove(this.domNode, 'text-field-active');
        },
        /**
         * Handler for the `onclick` event for the clear button.
         *
         * Clears the value and attempts to re-open the mobile keyboard display
         *
         * @param {Event} evt
         */
        _onClearClick: function(evt) {
            if(!domClass.contains(this.domNode, 'text-field-active'))
            {
                this.clearValue(true);
                event.stop(evt);
            }

            // Mobile browsers listen to either or both events to show keyboard
            this.inputNode.focus();
            this.inputNode.click();
        },
        /**
         * Fires {@link _Field#onChange onChange} if the value has changed since the previous notification event or
         * a direct setting of the value.
         * @param {Event} evt
         */
        onNotificationTrigger: function(evt) {
            var currentValue = this.getValue();

            if (this.previousValue != currentValue)
                this.onChange(currentValue, this);

            this.previousValue = currentValue;
        },
        /**
         * Immediately calls {@link _Field#validate validate} and adds the respective row styling.
         * @param {Event} evt
         */
        onValidationTrigger: function(evt) {
            if (this.validate())
                domClass.add(this.containerNode, 'row-error');
            else
                domClass.remove(this.containerNode, 'row-error');
        },
        /**
         * Returns the input nodes value
         * @return {String}
         */
        getValue: function() {
            return this.inputNode.value;
        },
        /**
         * Sets the value of the input node, clears the previous value for notification trigger and
         * if setting an initial value - set the originalValue to the passed value for dirty detection.
         * @param {String} val Value to be set
         * @param {Boolean} initial True if the value is the default/clean value, false if it is a meant as a dirty value
         */
        setValue: function(val, initial) {
            if (initial) this.originalValue = val;

            this.previousValue = false;

            this.set('inputValue', val);
        },
        /**
         * Clears the input nodes value, optionally clearing as a modified value.
         * @param {Boolean} asDirty If true it signifies the clearing is meant as destroying an
         * existing value and should then be detected as modified/dirty.
         */
        clearValue: function(asDirty) {
            var initial = asDirty !== true;

            this.setValue('', initial);
        },
        /**
         * Determines if the value has been modified from the default/original state
         * @return {Boolean}
         */
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });

    return FieldManager.register('text', control);
});