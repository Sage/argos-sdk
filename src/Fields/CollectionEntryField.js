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

define('Sage/Platform/Mobile/Fields/CollectionEntryField', [
    'dojo/_base/declare',
    'dojo/_base/event',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/query',
    'dojo/NodeList-manipulate',
    '../_UiComponent',
    '../_EventMapMixin',
    './_Field',
    './_CompositeMixin',
    'argos!scene'
], function(
    declare,
    event,
    lang,
    domConstruct,
    domClass,
    domAttr,
    query,
    nodeListManipulate,
    _UiComponent,
    _EventMapMixin,
    _Field,
    _CompositeMixin,
    scene
) {

    /*
     CollectionEntryInlineField (each item is a form)
     CollectionEntryField (list then form)
     CollectionField (external list / editor)
     */

    /* todo: this will be importing a number of ideas from List/Edit; find a way to re-use */
    return declare('Sage.Platform.Mobile.Fields.CollectionEntryField', [_Field, _UiComponent, _EventMapMixin, _CompositeMixin], {
        events: {
            'click': true
        },
        components: [
            {name: 'collection', tag: 'ul', attrs: {'class': 'list-content'}, attachPoint: 'collectionNode'},
            {name: 'content', tag: 'div', attrs: {'class': 'edit-content'}, attachPoint: 'contentNode'},
            {name: 'actions', tag: 'div', attrs: {'class': 'edit-actions'}, components: [
                {name: 'add', content: Simplate.make('<button class="button {%= $.addButtonClass %}" data-action="add">{%: $.addItemText %}</button>')}
            ]}
        ],
        baseClass: 'field-collection-entry',
        containerClass: 'row-collection-entry',
        addButtonClass: '',
        collectionNode: null,
        contentNode: null,

        /* todo: make generic */
        idProperty: '$key',
        itemsProperty: '$resources',
        labelProperty: '$descriptor',

        collectionRowTemplate: new Simplate([
            '<li data-index="{%= $$.getIndex($) %}">',
            '{%! $$.collectionItemTemplate %}',
            '</li>'
        ]),
        collectionItemTemplate: new Simplate([
            '<h3>{%: $$.getLabel($) %}</h3>',
            '<h4>{%: $$.getIdentity($) %}</h4>'
        ]),
        summaryRowTemplate: new Simplate([
        ]),

        currentItems: null,
        currentIndex: null,

        /**
         * Clears out selected values in the collection entry fields after an item is added if set to true
         */
        clearOnAdd: true,
        validateForAdd: true,
        validationResult: false,

        lookupLabelText: 'edit',
        lookupText: '...',
        emptyText: 'empty',
        completeText: 'OK',
        addItemText: 'Add',

        onStartup: function() {
            this.inherited(arguments);

            this.currentIndex = -1;

            if (this.validateForAdd)
            {
                for (var name in this.fields)
                {
                    var field = this.fields[name];
                    if (field.validator)
                    {
                        this.connect(field, 'onChange', this._onValidationFieldChange);
                    }
                }
            }

            this._onValidationFieldChange();
        },
        _onValidationFieldChange: function() {
            this.validationResult = this._validateComposite();

            domClass.toggle(this.domNode, 'has-invalid-entry', this.validationResult !== false);
        },
        getIndex: function(item) {
            return this.currentIndex;
        },
        getIdentity: function(item) {
            return item[this.identityProperty];
        },
        getLabel: function(item) {
            return item[this.labelProperty];
        },
        constructor: function() {
            this.sourceItems = [];
            this.currentItems = [];
        },
        _onComplete: function() {
            this.onChange(this.currentValue, this);
        },
        setText: function(text) {
            this.set('inputValue', text);
        },
        isDirty: function() {
            var original = this.originalValue,
                current = this.currentValue;

            if (current == original) return false;
            if (current && !original) return true;
            if (current.length != original.length) return true;

            for (var i = 0; i < current.length; i++)
            {
                if (current[i] !== original[i]) return true;
            }

            return false;
        },
        getValue: function(all) {
            var original = this.originalValue,
                current = this.currentValue,
                value = [];

            if (all)
                return current && current.slice(0);

            if (current)
            {
                /* todo: how to tag for deletion? */
                var result = [];

                for (var i = 0; i < current.length; i++)
                {
                    if (current[i] && current[i] !== original[i]) value.push(current[i]);
                }
            }

            return value;
        },
        _processData: function(items) {
            var count = items.length;
            if (count > 0)
            {
                var output = [];

                for (var i = 0; i < count; i++)
                {
                    var item = items[i];
                    this.currentIndex = i;

                    output.push(this.collectionRowTemplate.apply(item, this));
                }

                if (output.length > 0) domConstruct.place(output.join(''), this.collectionNode, 'last');

                this._addSummaryRow();

                domClass.add(this.domNode, 'has-items');
                this._onComplete();
            }
            else
            {
                this.currentIndex = -1;
                domClass.remove(this.domNode, 'has-items');
                domConstruct.empty(this.collectionNode);
            }
        },
        setValue: function(val, initial)
        {
            domClass.remove(this.domNode, 'has-items');

            if (val)
            {
                this.validationValue = this.currentValue = val.slice(0);

                if (initial) this.originalValue = val;

                this._processData(val);
            }
            else
            {
                this.validationValue = this.currentValue = [];

                if (initial) this.originalValue = [];

                domConstruct.empty(this.collectionNode);
            }
        },
        update: function(index, value) {
            if (value !== null)
            {
                this.validationValue[index] = this.currentValue[index] = value;
                domConstruct.empty(this.collectionNode);
                this._processData(this.currentValue);
            }
            else
            {
                this.remove(index);
            }
        },
        remove: function(index) {
            this.currentValue.splice(index, 1);
            domConstruct.empty(this.collectionNode);
            this._processData(this.currentValue);
        },
        clearValue: function() {
            this.inherited(arguments);

            this._clearCompositeValue();

            this.setValue(null, true);
        },
        add: function() {
            if (this.validateForAdd && this.validationResult !== false) return;

            var index = ++this.currentIndex,
                item = this._getCompositeValue();

            this.currentValue[index] = item;

            domConstruct.place(this.collectionRowTemplate.apply(item, this), this.collectionNode, 'last');

            this._addSummaryRow();

            if (this.clearOnAdd)
            {
                this._clearCompositeValue();
                this._onValidationFieldChange();
            }

            domClass.add(this.domNode, 'has-items');
            this._onComplete();

            if (this.owner) this.owner.resize();
        },
        _addSummaryRow: function() {
            if (this.summaryNode) domConstruct.destroy(this.summaryNode);

            var aggregate = this.aggregate(this.currentValue);

            this.summaryNode = domConstruct.place(this.summaryRowTemplate.apply(aggregate, this), this.collectionNode, 'last');
        },
        aggregate: function(items) {
            return items[0];
        }
    });
});