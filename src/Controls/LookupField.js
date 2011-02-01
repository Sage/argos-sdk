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
    var U = Sage.Platform.Mobile.Utility;

    Sage.Platform.Mobile.Controls.LookupField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {        
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button simpleSubHeaderButton"><span>{%: $.lookupText %}</span></button>',
            '<input type="text" {% if ($.requireSelection) { %}readonly="readonly"{% } %} />'
        ]),
        dependentErrorText: "A value for '{0}' must be selected.",
        view: false,
        keyProperty: '$key',
        textProperty: '$descriptor',
        textTemplate: null,
        textRenderer: null,
        valueKeyProperty: null,
        valueTextProperty: null,
        requireSelection: true,
        emptyText: '',
        completeText: 'Select',
        lookupText: '...',
        init: function() {
            Sage.Platform.Mobile.Controls.LookupField.superclass.init.apply(this, arguments);

            this.containerEl.on('click', this.onClick, this);

            if (this.isReadOnly())
            {
                this.containerEl.addClass('field-disabled');
                this.el.dom.readOnly = true;
            }
            else if (!this.requireSelection)
            {
                this.el
                    .on('keyup', this.onKeyUp, this)
                    .on('blur', this.onBlur, this);
            }
        },
        enable: function() {
            this.containerEl.removeClass('field-disabled');
        },
        disable: function() {
            this.containerEl.addClass('field-disabled');
        },
        isDisabled: function() {
            return this.containerEl.hasClass('field-disabled');
        },
        isReadOnly: function() {
            return !this.view;
        },
        getDependentValue: function() {
            if (this.dependsOn && this.owner)
            {
                var field = this.owner.fields[this.dependsOn];
                if (field) return field.getValue();
            }
        },
        getDependentLabel: function() {
            if (this.dependsOn && this.owner)
            {
                var field = this.owner.fields[this.dependsOn];
                if (field) return field.label;
            }
        },
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        createNavigationOptions: function() {
            var options = {
                selectionOnly: true,
                singleSelect: true,                
                resourceKind: this.resourceKind,
                resourcePredicate: this.resourcePredicate,
                where: this.where,
                orderBy: this.orderBy,
                tools: {
                    tbar: [{
                        id: 'complete',                       
                        fn: this.complete,
                        scope: this
                    },{
                        id: 'cancel',
                        side: 'left',
                        fn: ReUI.back,
                        scope: ReUI
                    }]
                }
            };

            var expand = ['resourceKind', 'resourcePredicate', 'where'],
                dependentValue = this.getDependentValue();

            if (this.dependsOn && !dependentValue)
            {
                alert(String.format(this.dependentErrorText, this.getDependentLabel()));
                return false;
            }

            Ext.each(expand, function(item) {
                if (this[item])
                    options[item] = this.dependsOn // only pass dependentValue if there is a dependency
                        ? this.expandExpression(this[item], dependentValue)
                        : this.expandExpression(this[item]);
            }, this);

            options.dependentValue = dependentValue;
            options.title = this.title;

            return options;
        },
        navigateToListView: function() {
            var view = App.getView(this.view),
                options = this.createNavigationOptions();
            if (view && options)
                view.show(options);
        },
        onClick: function(evt, el, o) {
            if (!this.isDisabled() && (evt.getTarget('.button') || this.requireSelection))
            {
                evt.stopEvent();                
                
                this.navigateToListView();
            }
        },
        onKeyUp: function(evt, el, o) {
            if (!this.isDisabled() && this.notificationTrigger == 'keyup')
                this.onNotificationTrigger(evt, el, o);
        },
        onBlur: function(evt, el, o) {
            if (!this.isDisabled() && this.notificationTrigger == 'blur')
                this.onNotificationTrigger(evt, el, o);
        },
        onNotificationTrigger: function(evt, el, o) {
            var currentValue = this.getValue();

            if (this.previousValue != currentValue)
                this.fireEvent('change', currentValue, this);

            this.previousValue = currentValue;
        },
        setText: function(text) {
            this.el.dom.value = text;

            this.previousValue = text;
        },
        getText: function() {
            return this.el.dom.value;
        },
        complete: function() {
            // todo: should there be a better way?
            var view = App.getActiveView();
            if (view && view.selectionModel)
            {
                var selections = view.selectionModel.getSelections();

                for (var selectionKey in selections)
                {
                    var val = selections[selectionKey].data,
                        success = true;

                    this.setSelection(val, selectionKey);
                    break;
                }

                ReUI.back();

                // if the event is fired before the transition, any XMLHttpRequest created in an event handler and
                // executing during the transition can potentially fail (status 0).  this might only be an issue with CORS
                // requests created in this state (the pre-flight request is made, and the request ends with status 0).
                // wrapping thing in a timeout and placing after the transition starts, mitigates this issue.
                if (success) setTimeout(this.onChange.createDelegate(this), 0);
            }
        },
        onChange: function() {
            this.fireEvent('change', this.currentValue, this);
        },
        isDirty: function() {
            if (this.originalValue && this.currentValue)
            {
                if (this.originalValue.key != this.currentValue.key)
                    return true;

                if (this.originalValue.text != this.currentValue.text)
                    return true;

                if (!this.requireSelection && !this.textTemplate)
                    if (this.originalValue.text != this.getText())
                        return true;                

                return false;
            }

            if (this.originalValue)
            {
                if (!this.requireSelection && !this.textTemplate)
                    if (this.originalValue.text != this.getText())
                        return true; 
            }
            else
            {
                if (!this.requireSelection && !this.textTemplate)
                {
                    var text = this.getText();
                    if (text && text.length > 0)
                        return true;
                }
            }

            return (this.originalValue != this.currentValue);
        },
        getSelection: function() {
            return this.currentSelection;
        },
        getValue: function() {
            var value = null,
                text = this.getText() || '',
                // if valueKeyProperty or valueTextProperty IS NOT EXPLICITLY set to false
                // and IS NOT defined use keyProperty or textProperty in its place.
                keyProperty = this.valueKeyProperty !== false
                    ? this.valueKeyProperty || this.keyProperty
                    : false,
                textProperty = this.valueTextProperty !== false
                    ? this.valueTextProperty || this.textProperty
                    : false;

            if (keyProperty || textProperty)
            {
                if (this.currentValue)
                {
                    if (keyProperty)
                        value = U.setValue(value || {}, keyProperty, this.currentValue.key);

                    // if a text template has been applied there is no way to guarantee a correct
                    // mapping back to the property
                    if (textProperty && !this.textTemplate)
                        value = U.setValue(value || {}, textProperty, this.requireSelection ? this.currentValue.text : text);
                }
                else if (!this.requireSelection)
                {
                    if (keyProperty && text.length > 0)
                        value = U.setValue(value || {}, keyProperty, text);

                    // if a text template has been applied there is no way to guarantee a correct
                    // mapping back to the property
                    if (textProperty && !this.textTemplate && text.length > 0)
                    {
                        value = U.setValue(value || {}, textProperty, text);
                    }
                }                
            }
            else
            {
                if (this.currentValue)
                {
                    value = this.requireSelection
                        ? this.currentValue.key
                        : this.currentValue.text != text && !this.textTemplate
                            ? text
                            : this.currentValue.key;
                }
                else if (!this.requireSelection && text.length > 0)
                {
                    value = text;
                }
            }
            
            return value;
        },
        setSelection: function(val, key) {
            var key = U.getValue(val, this.keyProperty, val) || key, // if we can extract the key as requested, use it instead of the selection key
                text = U.getValue(val, this.textProperty);

            if (text && this.textTemplate)
                text = this.textTemplate.apply(text, this);
            else if (this.textRenderer)
                text = this.textRenderer.call(this, val, key, text);

            this.currentSelection = val;

            this.currentValue = {
                key: key || text,
                text: text || key
            };

            this.setText(text);
        },
        setValue: function(val, initial) {
            // if valueKeyProperty or valueTextProperty IS NOT EXPLICITLY set to false
            // and IS NOT defined use keyProperty or textProperty in its place.
            var key,
                text,
                keyProperty = this.valueKeyProperty !== false
                    ? this.valueKeyProperty || this.keyProperty
                    : false,
                textProperty = this.valueTextProperty !== false
                    ? this.valueTextProperty || this.textProperty
                    : false;

            if (keyProperty || textProperty)
            {
                if (keyProperty)
                    key = U.getValue(val, keyProperty);

                if (textProperty)
                    text = U.getValue(val, textProperty);

                if (text && this.textTemplate)
                    text = this.textTemplate.apply(text, this);
                else if (this.textRenderer)
                    text = this.textRenderer.call(this, val, key, text);

                if (key || text)
                {
                    this.currentValue = {
                        key: key || text,
                        text: text || key
                    };

                    if (initial) this.originalValue = this.currentValue;

                    this.setText(this.currentValue.text);
                }
                else
                {
                    this.currentValue = false;

                    if (initial) this.originalValue = this.currentValue;

                    this.setText(this.requireSelection ? this.emptyText : '');    
                }
            }
            else
            {
                if (val !== undefined && val !== null)
                {
                    key = val;
                    text = val;

                    if (text && this.textTemplate)
                        text = this.textTemplate.apply(text, this);
                    else if (this.textRenderer)
                        text = this.textRenderer.call(this, val, key, text);

                    this.currentValue = {
                        key: key,
                        text: text
                    };

                    if (initial) this.originalValue = this.currentValue;

                    this.setText(text);
                }
                else
                {
                    this.currentValue = false;

                    if (initial) this.originalValue = this.currentValue;

                    this.setText(this.requireSelection ? this.emptyText : '');                
                }
            }        
        },
        clearValue: function(flag) {
            var initial = flag !== true;

            this.setValue(null, initial);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('lookup', Sage.Platform.Mobile.Controls.LookupField);
})();