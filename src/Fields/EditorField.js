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
define('Sage/Platform/Mobile/Fields/EditorField', ['Sage/Platform/Mobile/Fields/_Field'], function() {

    return dojo.declare('Sage.Platform.Mobile.Fields.EditorField', [Sage.Platform.Mobile.Fields._Field], {
        attributeMap: {
            inputValue: {
                node: 'inputNode',
                type: 'attribute',
                attribute: 'value'
            }
        },
        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.lookupLabelText %}"><span>{%: $.lookupText %}</span></button>',
            '<input data-dojo-attach-point="inputNode" type="text" />'
        ]),

        // Localization
        lookupLabelText: 'edit',
        lookupText: '...',
        emptyText: 'empty',
        completeText: 'Ok',

        formatValue: function(val) {
            return '';
        },
        init: function() {
            this.inherited(arguments);

            this.connect(this.containerNode, "onclick", this._onClick);
        },
        enable: function() {
            this.inherited(arguments);

            this._enableTextElement();
        },
        _enableTextElement: function() {
            this.inputNode.disabled = false;
        },
        disable: function() {
            this.inherited(arguments);
            
            this._disableTextElement();
        },
        _disableTextElement: function() {
            this.inputNode.disabled = true;
        },
        createNavigationOptions: function() {
            return {
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
                },
                entry: this.originalValue,
                changes: this.currentValue,
                entityName: this.entityName || (this.owner && this.owner.entityName)
            };
        },
        navigateToEditView: function() {
            if (this.isDisabled()) return;

            var view = App.getView(this.view),
                options = this.createNavigationOptions();

            if (view && options)
            {
                if (options.title) view.set('title', options.title);
                view.show(options);
            }
        },
        _onClick: function(evt) {
            dojo.stopEvent(evt);
            
            this.navigateToEditView();
        },
        getValuesFromView: function() {
            var view = App.getPrimaryActiveView(),
                values = view && view.getValues();

            if (view && values)
            {
                // todo: is this the appropriate way to handle this?  do not want $key, $name, etc., when applying values.
                // difference is primarily "as component" vs. "as child".
                this.currentValue = this.applyTo ? values : view.createEntry();
                this.validationValue = view.getValues(true); // store all editor values for validation, not only dirty values
            }
        },
        complete: function() {
            var view = App.getPrimaryActiveView();
            var success = true;

            if (view instanceof Sage.Platform.Mobile.Edit)
            {
                view.hideValidationSummary();

                if (view.validate() !== false)
                {
                    view.showValidationSummary();
                    return;
                }
            }

            this.getValuesFromView();

            this.setText(this.formatValue(this.validationValue));

            // todo: remove
            if (view.isValid && !view.isValid())
                return;
            else
                ReUI.back();

            // if the event is fired before the transition, any XMLHttpRequest created in an event handler and
            // executing during the transition can potentially fail (status 0).  this might only be an issue with CORS
            // requests created in this state (the pre-flight request is made, and the request ends with status 0).
            // wrapping thing in a timeout and placing after the transition starts, mitigates this issue.
            if (success) setTimeout(dojo.hitch(this, this._onComplete), 0);
        },
        _onComplete: function() {
            this.onChange(this.currentValue, this);
        },
        setText: function(text) {
            this.set('inputValue', text);
        },
        isDirty: function() {
            return this.originalValue !== this.currentValue;
        },
        getValue: function() {
            return this.currentValue;
        },
        validate: function(value) {
            return typeof value === 'undefined'
                ? Sage.Platform.Mobile.Fields._Field.prototype.validate.call(this, this.validationValue)
                : this.inherited(arguments);
        },
        setValue: function(val, initial)
        {            
            if (val)
            {
                this.validationValue = this.currentValue = val;

                if (initial) this.originalValue = this.currentValue;

                this.setText(this.formatValue(val));
            }
            else
            {
                this.validationValue = this.currentValue = null;

                if (initial) this.originalValue = this.currentValue;

                this.setText(this.emptyText);
            }
        },
        clearValue: function() {
            this.setValue(null, true);
        }
    });
});