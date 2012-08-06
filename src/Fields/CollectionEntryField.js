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
        emptyListNode: null,

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
        emptyListTemplate: new Simplate([
            '<li class="empty-list"><h4>{%: $.emptyListText %}</h4></li>'
        ]),
        summaryRowTemplate: new Simplate([
        ]),

        deletedValue: null,
        currentIndex: null,

        /**
         * Clears out selected values in the collection entry fields after an item is added if set to true
         */
        clearOnAdd: true,

        /**
         * If an aggregate function is defined it use the result with the
         * summaryRowTemplate and append the final HTML as the last row
         * @params Array - an array of each collection entry fields getValue()
         * @return Object - to be passed as $ to summaryRowTemplate
         */
        aggregate: null,

        /**
         * Determines whether to apply the emptyListTemplate to the collectionNode when no
         * items are present. If false it will completely empty the node and will be completely non-visible
         */
        displayEmptyList: true,

        /**
         * If `true`, only return modified values, otherwise return entire collection.
         */
        returnOnlyModified: false,

        validateForAdd: true,
        validationResult: false,

        lookupLabelText: 'edit',
        lookupText: '...',
        emptyText: 'empty',
        completeText: 'Ok',
        addItemText: 'Add',
        emptyListText: 'No items have been added.',

        onStartup: function() {
            this.inherited(arguments);

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
        validate: function(value) {
            return typeof value === 'undefined'
                ? this.inherited(arguments, [this.validationValue])
                : this.inherited(arguments);
        },
        /* todo: is this the appropriate naming? */
        formatDeletedValue: function(item) {
            return null;
        },
        getValue: function() {
            var original = this.originalValue,
                current = this.currentValue,
                deleted = this.deletedValue,
                value = [],
                previous, candidate, formatted, i;

            if (current)
            {
                for (i = 0; i < current.length; i++)
                {
                    previous = original[i];
                    candidate = current[i];

                    if (candidate)
                    {
                        if ((candidate !== previous) || !this.returnOnlyModified)
                        {
                            value.push(candidate);
                        }
                    }
                }
            }

            if (deleted)
            {
                for (i = 0; i < deleted.length && i < original.length; i++)
                {
                    candidate = deleted[i];

                    if (candidate)
                    {
                        formatted = this.formatDeletedValue(candidate);
                        if (formatted) value.push(formatted);
                    }
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
                    if (item)
                    {
                        this.currentIndex = i;

                        output.push(this.collectionRowTemplate.apply(item, this));
                    }
                }

                if (output.length > 0) domConstruct.place(output.join(''), this.collectionNode, 'only');

                this._addSummaryRow();

                domClass.add(this.domNode, 'has-items');

                this._onComplete();
            }
            else
            {
                this.clearCollectionList();
            }
        },
        setValue: function(val, initial)
        {
            this.currentIndex = -1;

            if (val)
            {
                this.deletedValue = [];
                this.currentValue = val.slice(0);

                this.validationValue = val.slice(0);

                if (initial) this.originalValue = val;

                this._processData(val);
            }
            else
            {
                this.deletedValue = [];
                this.currentValue = [];

                this.validationValue = [];

                if (initial) this.originalValue = [];

                this.clearCollectionList();
            }
        },
        clearCollectionList: function() {
            if (this.displayEmptyList)
            {
                domClass.add(this.domNode, 'has-items');

                this.emptyListNode = domConstruct.place(this.emptyListTemplate.apply(this), this.collectionNode, 'only');
            }
            else
            {
                domClass.remove(this.domNode, 'has-items');

                domConstruct.empty(this.collectionNode);
            }
        },
        update: function(index, value) {
            if (value !== null)
            {
                this.currentValue[index] = value;

                this.validationValue = this._compact(this.currentValue);

                this._processData(this.currentValue);
            }
            else
            {
                this.remove(index);
            }
        },
        remove: function(index) {
            this.deletedValue[index] = this.currentValue[index];
            this.currentValue[index] = null;

            this.validationValue = this._compact(this.currentValue);

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

            this.validationValue = this._compact(this.currentValue);

            if (this.emptyListNode)
                domConstruct.destroy(this.emptyListNode);

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
        _compact: function(values) {
            var result = [];

            if (values)
            {
                for (var i = 0; i < values.length; i++)
                {
                    if (values[i]) result.push(values[i]);
                }
            }

            return result;
        },
        _addSummaryRow: function() {
            if (this.summaryNode) domConstruct.destroy(this.summaryNode);

            var aggregate = this.aggregate && this.aggregate(this.validationValue);
            if (aggregate)
            {
                this.summaryNode = domConstruct.place(this.summaryRowTemplate.apply(aggregate, this), this.collectionNode, 'last');
            }
        }
    });
});