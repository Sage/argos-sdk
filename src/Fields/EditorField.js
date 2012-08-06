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

define('Sage/Platform/Mobile/Fields/EditorField', [
    'dojo/_base/declare',
    'dojo/_base/event',
    'dojo/_base/lang',
    '../_TemplatedWidgetMixin',
    './_Field',
    'argos!scene'
], function(
    declare,
    event,
    lang,
    _TemplatedWidgetMixin,
    _Field,
    scene
) {

    return declare('Sage.Platform.Mobile.Fields.EditorField', [_Field, _TemplatedWidgetMixin], {
        attributeMap: {
            inputValue: {
                node: 'inputNode',
                type: 'attribute',
                attribute: 'value'
            }
        },
        widgetTemplate: new Simplate([
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.lookupLabelText %}"><span>{%: $.lookupText %}</span></button>',
            '<input data-dojo-attach-point="inputNode" type="text" />'
        ]),

        // Localization
        lookupLabelText: 'edit',
        lookupText: '...',
        emptyText: 'empty',
        completeText: 'Ok',
        cancelText: 'Cancel',

        formatValue: function(val) {
            return '';
        },
        startup: function() {
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
                    top: [{
                        name: 'complete',
                        cls: 'complete',
                        label: this.completeText,
                        fn: this.complete,
                        scope: this
                    },{
                        name: 'cancel',
                        place: 'left',
                        label: this.cancelText,
                        publish: '/app/scene/back'
                    }]
                },
                entry: this.originalValue,
                changes: this.currentValue,
                entityName: this.entityName || (this.owner && this.owner.entityName),
                negateHistory: true
            };
        },
        navigateToEditView: function() {
            if (this.isDisabled()) return;

            var options = this.createNavigationOptions();

            scene().showView(this.view, options);
        },
        _onClick: function(evt) {
            event.stop(evt);
            
            this.navigateToEditView();
        },
        getValuesFromView: function(view) {
            var values = view && view.getValues();
            if (values)
            {
                // todo: is this the appropriate way to handle this?  do not want $key, $name, etc., when applying values.
                // difference is primarily "as component" vs. "as child".
                this.currentValue = this.applyTo ? values : view.createItem();
                this.validationValue = view.getValues(true); // store all editor values for validation, not only dirty values
            }
        },
        complete: function(view, item) {
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

            this.getValuesFromView(view);

            this.setText(this.formatValue(this.validationValue));

            // todo: remove
            if (view.isValid && !view.isValid())
                return;
            else
                scene().back();

            // if the event is fired before the transition, any XMLHttpRequest created in an event handler and
            // executing during the transition can potentially fail (status 0).  this might only be an issue with CORS
            // requests created in this state (the pre-flight request is made, and the request ends with status 0).
            // wrapping thing in a timeout and placing after the transition starts, mitigates this issue.
            if (success) setTimeout(lang.hitch(this, this._onComplete), 0);
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
                ? this.inherited(arguments, [this.validationValue])
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