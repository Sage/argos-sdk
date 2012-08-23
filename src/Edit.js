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

define('Sage/Platform/Mobile/Edit', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/connect',
    'dojo/_base/array',
    'dojo/_base/Deferred',
    'dojo/string',
    'dojo/dom',
    'dojo/topic',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/query',
    'dojo/NodeList-manipulate',
    './View',
    './ScrollContainer',
    './TitleBar',
    './Data/SDataStore',
    './ErrorManager',
    './Fields/FieldRegistry',
    './Convert',
    './Utility',
    'argos!customizations',
    'argos!scene'
], function(
    declare,
    lang,
    connect,
    array,
    Deferred,
    string,
    dom,
    topic,
    domAttr,
    domClass,
    domConstruct,
    query,
    nodeListManipulate,
    View,
    ScrollContainer,
    TitleBar,
    SDataStore,
    ErrorManager,
    FieldRegistry,
    convert,
    utility,
    customizations,
    scene
) {

    return declare('Sage.Platform.Mobile.Edit', [View], {
        events: {
            'click': true
        },
        components: [
            {name: 'fix', content: '<a href="#" class="android-6059-fix">fix for android issue #6059</a>'},
            {name: 'scroller', type: ScrollContainer, subscribeEvent: 'onContentChange:onContentChange', props: {enableFormFix:true}, components: [
                {name: 'scroll', tag: 'div', components: [
                    {name: 'loading', content: Simplate.make('<div class="loading-indicator"><div>{%: $.loadingText %}</div></div>')},
                    {name: 'validation', tag: 'div', attrs: {'class': 'validation-summary'}, components: [
                        {name: 'validationTitle', content: Simplate.make('<h2>{%: $.validationSummaryText %}</h2>')},
                        {name: 'validationContent', tag: 'ul', attachPoint: 'validationContentNode'}
                    ]},
                    {name: 'content', tag: 'div', attrs: {'class': 'edit-content'}, attachPoint: 'contentNode'}
                ]}
            ]}
        ],
        baseClass: 'view edit',
        _setValidationContentAttr: {node: 'validationContentNode', type: 'innerHTML'},

        validationSummaryItemTemplate: new Simplate([
            '<li data-field="{%= $.name %}">',
            '<h3>{%: $.message %}</h3>',
            '<h4>{%: $$.label %}</h4>',
            '</li>'
        ]),
        sectionTemplate: new Simplate([
            '{% if ($.title !== false) { %}',
            '<h2 data-action="toggleCollapse" class="{% if ($.collapsed) { %}is-collapsed{% } %}">',
                '<span>{%: ($.title) %}</span>',
                '<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '{% } %}',
            '<fieldset class="{%= $.cls %}">',
            '</fieldset>'
        ]),
        rowTemplate: new Simplate([
            '<div class="row row-edit {%= $.containerClass || $.cls %}" data-field="{%= $.name || $.property %}" data-field-type="{%= $.type %}">',
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '</div>'
        ]),
        id: 'generic_edit',
        tier: 1,
        store: null,
        layout: null,
        insertSecurity: false,
        updateSecurity: false,
        customizationSet: 'edit',

        saveText: 'Save',
        cancelText: 'Cancel',
        titleText: 'Edit',
        toggleCollapseText: 'toggle collapse',
        validationSummaryText: 'Validation Summary',
        detailsText: 'Details',
        loadingText: 'loading...',
        requestErrorText: 'A server error occurred while requesting data.',

        constructor: function(o) {
            this.fields = {};
        },
        onStartup: function() {
            this.inherited(arguments);

            var customizationSet = customizations(),
                layout = customizationSet.apply(customizationSet.toPath(this.customizationSet, null, this.id), this.createLayout());
            
            this._processLayout(layout);

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

            delete this.store;

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
        createToolLayout: function() {
            return this.tools || (this.tools = {
                'top': [{
                    name: 'save',
                    label: this.saveText,
                    action: 'save',
                    security: this.options && this.options.insert
                        ? this.insertSecurity
                        : this.updateSecurity
                },{
                    name: 'cancel',
                    label: this.cancelText,
                    place: 'left',
                    publish: '/app/scene/back'
                }]
            });
        },
        _getStoreAttr: function() {
            return this.store || (this.store = this.createStore());
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
        toggleCollapse: function(evt, node) {
            if (node) domClass.toggle(node, 'is-collapsed');

            this.onContentChange();
        },
        createStore: function() {
            return null;
        },
        onContentChange: function() {
        },
        _processItem: function(item) {
            return item;
        },
        _processData: function(item) {
            this.item = this._processItem(item);

            this.setValues(item, true);

            // Re-apply any passed changes as they may have been overwritten
            if (this.options.changes)
            {
                this.changes = this.options.changes;
                this.setValues(this.changes);
            }
        },
        _onGetComplete: function(item) {
            if (item)
            {
                this._processData(item);
            }
            else
            {
                /* todo: show error message? */
            }

            domClass.remove(this.domNode, 'is-loading');

            /* this must take place when the content is visible */
            this.onContentChange();
            connect.publish('/app/toolbar/update', []);
        },
        _onGetError: function(getOptions, error) {
            if (error.aborted)
            {
                /* todo: show error message? */
            }
            else if (error.status == 404)
            {
                /* todo: show error message */
            }
            else
            {
                alert(string.substitute(this.requestErrorText, [error]));
            }

            var errorItem = {
                viewOptions: this.options,
                serverError: error
            };
            ErrorManager.addError(this.requestErrorText, errorItem);

            domClass.remove(this.domNode, 'is-loading');
        },
        _requestData: function() {
            domClass.add(this.domNode, 'is-loading');

            var store = this.get('store'),
                getOptions = {
                };

            this._applyStateToGetOptions(getOptions);

            var getExpression = this._buildGetExpression() || null,
                getResults = store.get(getExpression, getOptions);

            Deferred.when(getResults,
                lang.hitch(this, this._onGetComplete),
                lang.hitch(this, this._onGetError, getOptions)
            );

            return getResults;
        },
        createLayout: function() {
            return this.layout || [];
        },
        _processLayoutRow: function(layout, row, sectionNode) {
            var ctor = (typeof row['type'] === 'string')
                    ? FieldRegistry.getFieldFor(row['type'], false)
                    : row['type'],
                name = row['name'] || row['property'],
                field = this.fields[name] = new ctor(lang.mixin({
                    id: this.id + ':' + name,
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
        _processTemplateData: function(template) {
            this.itemTemplate = this._processItem(template);

            this.setValues(this.itemTemplate, true);

            this.applyDefaultValues(this.fields);
            this.applyContext(template);

            // Re-apply any passed changes as they may have been overwritten
            if (this.options.changes)
            {
                this.changes = this.options.changes;
                this.setValues(this.changes);
            }

            domClass.remove(this.domNode, 'is-loading');

            /* this must take place when the content is visible */
            this.onContentChange();
            connect.publish('/app/toolbar/update', []);
        },
        _requestTemplateData: function() {
            domClass.add(this.domNode, 'is-loading');

            this._processTemplateData(this.createItemTemplate());
        },
        createItemTemplate: function() {
            return {};
        },
        applyContext: function(templateEntry) {
        },
        applyDefaultValues: function(fields){
            for (var name in fields)
            {
                var field = fields[name],
                    defaultValue = field['default'];

                if (typeof field['fields'] !== 'undefined')
                    this.applyDefaultValues(field['fields']);

                if (typeof defaultValue === 'undefined') continue;

                field.setValue(utility.expand(this, defaultValue, field));
            }
        },
        clearValues: function() {
            for (var name in this.fields)
            {
                this.fields[name].clearValue();
            }
        },
        setValues: function(values, initial) {
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
        getValues: function(all) {
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
        },
        createItem: function() {
            var values = this.getValues();

            return this.inserting
                ? this.createItemForUpdate(values)
                : this.createItemForInsert(values);
        },
        createItemForUpdate: function(values) {
            return values;
        },
        createItemForInsert: function(values) {
            return values;
        },
        isFormDisabled: function() {
            return this.busy;
        },
        disable: function() {
            this.busy = true;

            topic.publish('/app/toolbar/toggle', 'top', false);

            domClass.add(this.domNode, 'is-busy');
        },
        enable: function() {
            this.busy = false;

            topic.publish('/app/toolbar/toggle', 'top', true);

            domClass.remove(this.domNode, 'is-busy');
        },
        insert: function() {
            var values = this.getValues();
            if (values)
            {
                this.disable();

                var store = this.get('store'),
                    addOptions = {
                        overwrite: false
                    },
                    item = this.createItemForInsert(values);

                this._applyStateToAddOptions(addOptions);

                Deferred.when(store.add(item, addOptions),
                    lang.hitch(this, this._onAddComplete, item),
                    lang.hitch(this, this._onAddError, addOptions)
                );
            }
            else
            {
                scene().back();
            }
        },
        _applyStateToAddOptions: function(addOptions) {
        },
        _onAddComplete: function(item, result) {
            this.enable();

            var message = this._buildRefreshMessage(item, result);

            connect.publish('/app/refresh', [message]);

            this.onInsertComplete(result);
        },
        _onAddError: function(addOptions, error) {
            alert(string.substitute(this.requestErrorText, [error]));

            var errorItem = {
                viewOptions: this.options,
                serverError: error
            };
            ErrorManager.addError(this.requestErrorText, errorItem);

            this.enable();
        },
        onInsertComplete: function(result) {
            var options = this.options,
                /* todo: should this be called `returnTo`? */
                returnTo = options && utility.expand(this, options.returnTo, result, this);
            if (returnTo)
            {
                if (lang.isArray(returnTo))
                    scene().showView.apply(scene(), returnTo);
                else if (typeof returnTo === 'string')
                    scene().showView(options.returnTo);
                else
                    scene().back(-1 * options.returnTo);
            }
            else
            {
                scene().back();
            }
        },
        onRequestFailure: function(response, o) {
            alert(string.substitute(this.requestErrorText, [response, o]));

            var errorItem = {
                viewOptions: this.options,
                serverError: response
            };
            ErrorManager.addError(this.requestErrorText, errorItem);
        },
        update: function() {
            var values = this.getValues();
            if (values)
            {
                this.disable();

                var store = this.get('store'),
                    putOptions = {
                        overwrite: true,
                        id: store.getIdentity(this.item)
                    },
                    item = this.createItemForUpdate(values);

                this._applyStateToPutOptions(putOptions);

                Deferred.when(store.put(item, putOptions),
                    lang.hitch(this, this._onPutComplete, item),
                    lang.hitch(this, this._onPutError, putOptions)
                );
            }
            else
            {
                this.onUpdateComplete(false);
            }
        },
        _applyStateToPutOptions: function(putOptions) {
        },
        _buildRefreshMessage: function(item, result) {
            if (item)
            {
                var store = this.get('store'),
                    id = store.getIdentity(item);
                return {
                    id: id,
                    key: id,
                    data: result
                };
            }
        },
        _onPutComplete: function(item, result) {
            this.enable();

            var message = this._buildRefreshMessage(item, result);

            connect.publish('/app/refresh', [message]);

            this.onUpdateComplete(item);
        },
        _onPutError: function(putOptions, error) {

            alert(string.substitute(this.requestErrorText, [error]));

            var errorItem = {
                viewOptions: this.options,
                serverError: error
            };
            ErrorManager.addError(this.requestErrorText, errorItem);

            this.enable();
        },
        onUpdateComplete: function(item) {
            var options = this.options,
                /* todo: should this be called `returnTo`? */
                returnTo = options && utility.expand(this, options.returnTo, item, this);
            if (returnTo)
            {
                if (lang.isArray(returnTo))
                    scene().showView.apply(scene(), returnTo);
                else if (typeof returnTo === 'string')
                    scene().showView(options.returnTo);
                else
                    scene().back(-1 * options.returnTo);
            }
            else
            {
                scene().back();
            }
        },
        showValidationSummary: function() {
            var content = [];                        

            for (var i = 0; i < this.errors.length; i++)
                content.push(this.validationSummaryItemTemplate.apply(this.errors[i], this.fields[this.errors[i].name]));

            this.set('validationContent', content.join(''));

            domClass.add(this.domNode, 'has-error');

            this.onContentChange();
        },
        hideValidationSummary: function() {
            domClass.remove(this.domNode, 'has-error');
            this.set('validationContent', '');
        },
        save: function() {
            if (this.isFormDisabled())  return;

            this.hideValidationSummary();

            if (this.validate() !== false)
            {
                this.showValidationSummary();
                return;
            }

            if (this.inserting)
                this.insert();
            else
                this.update();
        },
        /* todo: move SData options into mixin */
        getContext: function() {
            var store = this.get('store'),
                options = this.options,
                id = options.insert ? false : store && store.getIdentity(options.item || options.entry);

            return lang.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind,
                id: id
            });
        },
        getSecurity: function(access) {
            var lookup = {
                'update': this.updateSecurity,
                'insert': this.insertSecurity
            };

            return lookup[access];
        },
        activate: function(options, previous) {
            this.inherited(arguments);

            /* if we are not activating previous options, force a refresh of the view */
            if (!previous) this.refreshRequired = true;
        },
        beforeTransitionTo: function() {
            if (this.refreshRequired)
            {
                if (this.options.insert === true || this.options.key)
                    domClass.add(this.domNode, 'is-loading');
                else
                    domClass.remove(this.domNode, 'is-loading');
            }

            this.inherited(arguments);
        },
        refreshRequiredFor: function(options) {
            if (this.options)
            {
                if (options)
                {
                    if (this.options === options) return false;

                    if (this.options.id !== options.id) return true;
                    if (this.options.key !== options.key) return true;
                    if (this.options.item !== options.item) return true;
                    if (this.options.entry !== options.entry) return true;
                    if (this.options.insert !== options.insert) return true;
                    if (this.options.changes !== options.changes) return true;
                    if (this.options.template !== options.template) return true;
                }

                return false;
            }
            else
                return this.inherited(arguments);
        },
        load: function() {
            this.inherited(arguments);

            /* todo: move this to clear? */
            this.changes = false;
            this.inserting = (this.options.insert === true);
            this.itemTemplate = false;
            this.item = false;

            domClass.remove(this.domNode, 'has-error');

            this.clearValues();

            if (this.inserting)
            {
                if (this.options.template)
                {
                    this._processTemplateData(this.options.template);
                }
                else
                {
                    this._requestTemplateData();
                }
            }
            else
            {
                // apply entry as non-modified data
                if (this.options.item || this.options.entry)
                {
                    this.item = this._processItem(this.options.item || this.options.entry);

                    this.setValues(this.item, true);

                    // apply changes as modified data, since we want this to feed-back through
                    // the changes option is primarily used by editor fields
                    if (this.options.changes)
                    {
                        this.changes = this.options.changes;
                        this.setValues(this.changes);
                    }
                    connect.publish('/app/toolbar/update', []);
                }
                else
                {
                    // if key is passed request that keys entity and process
                    if (this.options.id || this.options.key) this._requestData();
                }
            }
        }
    });
});