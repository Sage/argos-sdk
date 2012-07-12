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
    'argos!customizations'
], function(
    declare,
    lang,
    connect,
    array,
    Deferred,
    string,
    dom,
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
    customizations
) {

    return declare('Sage.Platform.Mobile.Edit', [View], {
        events: {
            'click': true
        },
        components: [
            {name: 'fix', content: '<a href="#" class="android-6059-fix">fix for android issue #6059</a>'},
            {name: 'scroller', type: ScrollContainer, subscribeEvent: 'onContentChange:onContentChange', components: [
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
        _setEditContentAttr: {node: 'contentNode', type: 'innerHTML'},
        _setValidationContentAttr: {node: 'validationContentNode', type: 'innerHTML'},

        validationSummaryItemTemplate: new Simplate([
            '<li data-field="{%= $.name %}">',
            '<h3>{%: $.message %}</h3>',
            '<h4>{%: $$.label %}</h4>',
            '</li>'
        ]),
        sectionTemplate: new Simplate([
            '<h2 data-action="toggleSection" class="{% if ($.collapsed) { %}is-collapsed{% } %} {% if ($.title === false) { %}is-hidden{% } %}">',
            '{%: ($.title) %}<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '<fieldset class="{%= $.cls %}">',
            '<a href="#" class="android-6059-fix">fix for android issue #6059</a>',
            '</fieldset>'
        ]),
        propertyTemplate: new Simplate([
            '<div class="row row-edit {%= $.cls %}" data-field="{%= $.name || $.property %}" data-field-type="{%= $.type %}">',
            '</div>'
        ]),
        id: 'generic_edit',
        tier: 1,
        store: null,
        layout: null,
        customizationSet: 'edit',
        saveText: 'Save',
        titleText: 'Edit',
        toggleCollapseText: 'toggle collapse',
        validationSummaryText: 'Validation Summary',
        detailsText: 'Details',
        loadingText: 'loading...',
        requestErrorText: 'A server error occurred while requesting data.',
        insertSecurity: false,
        updateSecurity: false,
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
                    id: 'save',
                    action: 'save',
                    security: this.options && this.options.insert
                        ? this.insertSecurity
                        : this.updateSecurity
                },{
                    id: 'cancel',
                    side: 'left',
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
        toggleSection: function(evt, node) {
            if (node) domClass.toggle(node, 'is-collapsed');

            this.onContentChange();
        },
        createStore: function() {
            return null;
        },
        resize: function() {
            this.inherited(arguments);

            this.onContentChange();
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
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'only');
            }

            domClass.remove(this.domNode, 'is-loading');

            /* this must take place when the content is visible */
            this.onContentChange();
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

            ErrorManager.addError(error.xhr, getOptions, this.options, error.aborted ? 'aborted' : 'failure');

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
            var ctor = FieldRegistry.getFieldFor(row['type'], false),
                field = this.fields[row['name'] || row['property']] = new ctor(lang.mixin({
                    owner: this
                }, row)),
                template = field.propertyTemplate || this.propertyTemplate;

            this.connect(field, 'onShow', this._onShowField);
            this.connect(field, 'onHide', this._onHideField);
            this.connect(field, 'onEnable', this._onEnableField);
            this.connect(field, 'onDisable', this._onDisableField);

            domConstruct.place(template.apply(field, this), sectionNode, 'last');
        },
        _processLayout: function(layout)
        {
            var rows = (layout['children'] || layout['as'] || layout),
                options = layout['options'] || (layout['options'] = {
                    title: this.detailsText
                }),
                sectionQueue = [],
                sectionStarted = false,
                i, current;
            
            for (i = 0; i < rows.length; i++)
            {
                current = rows[i];

                var section,
                    sectionNode;

                if (current['children'] || current['as'])
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
                    sectionNode = section.lastChild;
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

            this.applyDefaultValues();
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
        applyDefaultValues: function(){
            for (var name in this.fields)
            {
                var field = this.fields[name],
                    defaultValue = field['default'];

                if (typeof defaultValue === 'undefined') continue;

                field.setValue(this.expandExpression(defaultValue, field));
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

                include = this.expandExpression(field.include, value, field, this);
                exclude = this.expandExpression(field.exclude, value, field, this);

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
            this.errors = [];

            for (var name in this.fields)
            {
                var field = this.fields[name],
                    result;

                if (!field.isHidden() && false !== (result = field.validate()))
                {
                    domClass.add(field.containerNode, 'row-error');

                    this.errors.push({
                        name: name,
                        message: result
                    });
                }
                else
                {
                    domClass.remove(field.containerNode, 'row-error');
                }
            }

            return this.errors.length > 0
                ? this.errors
                : false;
        },
        createEntry: function() {
            var values = this.getValues();

            return this.inserting
                ? this.createEntryForInsert(values)
                : this.createEntryForUpdate(values);
        },
        createEntryForUpdate: function(values) {
            values = this.convertValues(values);

            return lang.mixin(values, {
                '$key': this.entry['$key'],
                '$etag': this.entry['$etag'],
                '$name': this.entry['$name']
            });
        },
        createEntryForInsert: function(values) {
            values = this.convertValues(values);
            
            return lang.mixin(values, {
                '$name': this.entityName
            });
        },
        isFormDisabled: function() {
            return this.busy;
        },
        disable: function() {
            this.busy = true;

            if (App.bars.tbar)
                App.bars.tbar.disable();

            domClass.add(this.domNode, 'busy');
        },
        enable: function() {
            this.busy = false;

            if (App.bars.tbar)
                App.bars.tbar.enable();

            domClass.remove(this.domNode, 'busy');
        },
        insert: function() {
            this.disable();

            var values = this.getValues();
            if (values)
            {
                var entry = this.createEntryForInsert(values);

                var request = this.createRequest();
                if (request)
                    request.create(entry, {
                        success: this.onInsertSuccess,
                        failure: this.onInsertFailure,
                        scope: this
                    });
            }
            else
            {
                ReUI.back();
            }
        },
        onInsertSuccess: function(entry) {
            this.enable();

            connect.publish('/app/refresh', [{
                resourceKind: this.resourceKind
            }]);

            this.onInsertCompleted(entry);
        },
        onInsertFailure: function(response, o) {
            this.enable();
            this.onRequestFailure(response, o);
        },
        onInsertCompleted: function(entry) {
            if (this.options && this.options.returnTo)
            {
                var returnTo = this.options.returnTo,
                    view = App.getView(returnTo);
                if (view)
                    view.show();
                else
                    window.location.hash = returnTo;
            }
            else
            {
                ReUI.back();
            }
        },
        onRequestFailure: function(response, o) {
            alert(string.substitute(this.requestErrorText, [response, o]));
            ErrorManager.addError(response, o, this.options, 'failure');
        },
        update: function() {
            var values = this.getValues();
            if (values)
            {
                this.disable();

                var entry = this.createEntryForUpdate(values);

                var request = this.createRequest();
                if (request)
                    request.update(entry, {
                        success: this.onUpdateSuccess,
                        failure: this.onUpdateFailure,
                        scope: this
                    });
            }
            else
            {
                this.onUpdateCompleted(false);
            }
        },
        onUpdateSuccess: function(entry) {
            this.enable();

            connect.publish('/app/refresh', [{
                resourceKind: this.resourceKind,
                key: entry['$key'],
                data: entry
            }]);

            this.onUpdateCompleted(entry);
        },
        onUpdateFailure: function(response, o) {
            this.enable();
            this.onRequestFailure(response, o);
        },
        onUpdateCompleted: function(entry) {
            if (this.options && this.options.returnTo)
            {
                var returnTo = this.options.returnTo,
                    view = App.getView(returnTo);
                if (view)
                    view.show();
                else
                    window.location.hash = returnTo;
            }
            else
            {
                ReUI.back();
            }
        },
        showValidationSummary: function() {
            var content = [];                        

            for (var i = 0; i < this.errors.length; i++)
                content.push(this.validationSummaryItemTemplate.apply(this.errors[i], this.fields[this.errors[i].name]));

            this.set('validationContent', content.join(''));
            domClass.add(this.domNode, 'has-error');
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

            /* todo: finish save */
        },
        getContext: function() {
            return lang.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind,
                insert: this.options.insert,
                key: this.options.insert ? false : this.options.entry && this.options.entry['$key']
            });
        },
        getSecurity: function(access) {
            var lookup = {
                'update': this.updateSecurity,
                'insert': this.insertSecurity
            };

            return lookup[access];
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
                    if (this.options.key && this.options.key === options['key'])
                        return false;
                }
                return true;
            }
            else
                return this.inherited(arguments);
        },
        refresh: function() {
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
                    this.itemTemplate = this._processItem(this.options.template);

                    // todo: should the template be applied to the store, fully? or just to the form?
                    this.setValues(this.itemTemplate, true);
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