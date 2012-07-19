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

define('Sage/Platform/Mobile/Fields/_CompositeMixin', [
    'dojo/_base/declare',
    'dojo/_base/event',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/query',
    'dojo/NodeList-manipulate',
    './FieldRegistry',
    '../Utility'
], function(
    declare,
    event,
    lang,
    array,
    domConstruct,
    domClass,
    domAttr,
    query,
    nodeListManipulate,
    FieldRegistry,
    utility
) {
    return declare('Sage.Platform.Mobile.Fields._CompositeMixin', null, {
        sectionTemplate: new Simplate([
            '{% if ($.title !== false) { %}',
            '<h2 data-action="toggleCollapse" class="{% if ($.collapsed) { %}is-collapsed{% } %}">',
                '<span>{%: ($.title) %}</span>',
                '<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '{% } %}',
            '{% if ($.list) { %}',
            '<ul class="{%= $.cls %}"></ul>',
            '{% } else { %}',
            '<div class="{%= $.cls %}"></div>',
            '{% } %}'
        ]),
        rowTemplate: new Simplate([
            '<div class="row row-edit {%= $.containerClass || $.cls %}" data-field="{%= $.name || $.property %}" data-field-type="{%= $.type %}">',
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '</div>'
        ]),

        fields: null,

        constructor: function(props) {
            this.fields = {};
        },
        _onShowField: function(field) {
            domClass.remove(field.containerNode, 'row-hidden');
        },
        _onHideField: function(field) {
            domClass.add(field.containerNode, 'row-hidden');
        },
        _onEnableField: function(field) {
            domClass.remove(field.containerNode, 'row-disabled');
        },
        _onDisableField: function(field) {
            domClass.add(field.containerNode, 'row-disabled');
        },
        _processLayoutRow: function(layout, row, sectionNode) {
            var ctor = typeof row['type'] === 'string'
                    ? FieldRegistry.getFieldFor(row['type'], false)
                    : row['type'],
                field = this.fields[row['name'] || row['property']] = new ctor(lang.mixin({
                    owner: this
                }, row)),
                rowTemplate = field.rowTemplate || this.rowTemplate;

            this.connect(field, 'onShow', this._onShowField);
            this.connect(field, 'onHide', this._onHideField);
            this.connect(field, 'onEnable', this._onEnableField);
            this.connect(field, 'onDisable', this._onDisableField);

            domConstruct.place(rowTemplate.apply(field, this), sectionNode, 'last');
        },
        _processLayout: function(layout)
        {
            var rows = typeof layout['children'] === 'function'
                ? layout['children'].call(this, layout)
                : layout['children']
                    ? layout['children']
                    : layout,
                sectionQueue = [],
                sectionStarted = false,
                i, current;

            for (i = 0; i < rows.length; i++)
            {
                current = rows[i];

                var section,
                    sectionNode;

                if (current['children'])
                {
                    if (sectionStarted)
                        sectionQueue.push(current);
                    else
                        this._processLayout(current);

                    continue;
                }

                if (!sectionStarted)
                {
                    sectionStarted = true;
                    section = domConstruct.toDom(this.sectionTemplate.apply(layout, this));
                    sectionNode = section.lastChild || section;
                    domConstruct.place(section, this.contentNode);
                }

                this._processLayoutRow(layout, current, sectionNode);
            }

            for (var i = 0; i < sectionQueue.length; i++)
            {
                var current = sectionQueue[i];

                this._processLayout(current);
            }
        },
        onStartup: function() {
            this.inherited(arguments);

            this._processLayout(this.layout);

            query('div[data-field]', this.contentNode).forEach(function(node) {
                var name = domAttr.get(node, 'data-field'),
                    field = this.fields[name];
                if (field)
                {
                    field.renderTo(node);
                    field.startup();
                }
            }, this);
        },
        onDestroy: function() {
            this.inherited(arguments);

            if (this.fields)
            {
                for (var name in this.fields)
                {
                    var field = this.fields[name];
                    if (field)
                        field.destroy();
                }

                delete this.fields;
            }
        },
        isDirty: function() {
            for (var name in this.fields)
            {
                if (this.fields[name].isDirty()) return true;
            }

            return false;
        },
        _setCompositeValues: function(values, initial) {
            var noValue = {},
                field,
                value;

            for (var name in this.fields)
            {
                field = this.fields[name];

                // for now, explicitly hidden fields (via. the field.hide() method) are not included
                if (field.isHidden()) continue;

                if (field.applyTo !== false)
                {
                    value = utility.getValue(values, field.applyTo, noValue);
                }
                else
                {
                    value = utility.getValue(values, field.property || name, noValue);
                }

                // fyi: uses the fact that ({} !== {})
                if (value !== noValue) field.setValue(value, initial);
            }
        },
        _getCompositeValues: function(all) {
            var o = {},
                empty = true,
                field,
                value,
                target,
                include,
                exclude;

            for (var name in this.fields)
            {
                field = this.fields[name];
                value = field.getValue();

                include = utility.expand(this, field.include, value, field, this);
                exclude = utility.expand(this, field.exclude, value, field, this);

                /**
                 * include:
                 *   true: always include value
                 *   false: always exclude value
                 * exclude:
                 *   true: always exclude value
                 *   false: default handling
                 */
                if (include !== undefined && !include) continue;
                if (exclude !== undefined && exclude) continue;

                // for now, explicitly hidden fields (via. the field.hide() method) are not included
                if (all || ((field.alwaysUseValue || field.isDirty() || include) && !field.isHidden()))
                {
                    if (field.applyTo !== false)
                    {
                        target = utility.getValue(o, field.applyTo);
                        lang.mixin(target, value);
                    }
                    else
                    {
                        utility.setValue(o, field.property || name, value);
                    }

                    empty = false;
                }
            }
            return empty ? false : o;
        },
        getValue: function() {
            return this._getCompositeValues();
        },
        setValue: function(val, initial) {
            this._setCompositeValues(val, initial);
        },
        clearValue: function() {
            this._setCompositeValues(null, true);
        },
        validate: function() {
            var errors = [];

            for (var name in this.fields)
            {
                var field = this.fields[name],
                    result;

                if (!field.isHidden() && false !== (result = field.validate()))
                {
                    domClass.add(field.containerNode, 'row-error');

                    array.forEach(lang.isArray(result) ? result : [result], function(message) {
                        errors.push({name: name, message: message});
                    });
                }
                else
                {
                    domClass.remove(field.containerNode, 'row-error');
                }
            }

            this.errors = errors;

            return errors.length > 0
                ? errors
                : false;
        }
    });
});