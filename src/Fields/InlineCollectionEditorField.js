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

define('Sage/Platform/Mobile/Fields/InlineCollectionEditorField', [
    'dojo/_base/declare',
    'dojo/_base/event',
    'dojo/_base/lang',
    'dojo/dom-construct',
    '../_UiComponent',
    './_Field',
    'argos!scene'
], function(
    declare,
    event,
    lang,
    domConstruct,
    _UiComponent,
    _Field,
    scene
) {

    return declare('Sage.Platform.Mobile.Fields.InlineCollectionEditorField', [_Field, _UiComponent], {
        components: [
            {name: 'content', tag: 'ul', attrs: {'class': 'list-content'}, attachPoint: 'contentNode'},
            {name: 'editor', tag: 'div', attrs: {'class': 'editor-container'}, attachPoint: 'editorNode'}
        ],
        editorNode: null,
        contentNode: null,

        rowTemplate: new Simplate([
            '<li data-index="">',
            '{%! $$.itemTemplate %}',
            '</li>'
        ]),
        itemTemplate: new Simplate([
            '<h3>{%: $.$descriptor %}</h3>',
            '<h4>{%: $.$key %}</h4>'
        ]),

        lookupLabelText: 'edit',
        lookupText: '...',
        emptyText: 'empty',
        completeText: 'OK',

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
                ReUI.back();

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
            domConstruct.empty(this.contentNode);

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