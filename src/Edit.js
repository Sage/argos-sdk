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
/**
 * An Edit View is a dual purpose view - used for both Creating and Updating records. It is comprised
 * of a layout similar to Detail rows but are instead Edit fields.
 *
 * A unique part of the Edit view is it's lifecycle in comparison to Detail. The Detail view is torn
 * down and rebuilt with every record. With Edit the form is emptied (HTML left in-tact) and new values
 * are applied to the fields.
 *
 * Since Edit Views are typically the "last" view (you always come from a List or Detail view) it warrants
 * special attention to the navigation options that are passed, as they greatly control how the Edit view
 * functions and operates.
 *
 * @alternateClassName Edit
 * @extends View
 * @requires ScrollContainer
 * @requires TitleBar
 * @requires ErrorManager
 * @requires FieldRegistry
 * @requires convert
 * @requires utility
 * @requires CustomizationSet
 * @requires scene
 */
define('argos/Edit', [
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
    './ErrorManager',
    './Fields/FieldRegistry',
    './convert',
    './utility',
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
    ErrorManager,
    FieldRegistry,
    convert,
    utility,
    customizations,
    scene
) {

    return declare('argos.Edit', [View], {
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

        /**
         * @property {Simplate}
         * HTML shown when data is being loaded.
         *
         * * `$` => validation error object
         * * `$$` => field instance that the error is on
         */
        validationSummaryItemTemplate: new Simplate([
            '<li data-field="{%= $.name %}">',
            '<h3>{%: $.message %}</h3>',
            '<h4>{%: $$.label %}</h4>',
            '</li>'
        ]),
        /**
         * @property {Simplate}
         * HTML that defines a section of layout
         *
         * `$` => the layout section being rendered
         * `$$` => the view instance
         */
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
        /**
         * @property {Simplate}
         * HTML created for each field row.
         *
         * * `$` => the field row object defined in {@link #createLayout createLayout}.
         * * `$$` => the view instance
         */
        rowTemplate: new Simplate([
            '<div class="row row-edit {%= $.containerClass || $.cls %}" data-field="{%= $.name || $.property %}" data-field-type="{%= $.type %}">',
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '</div>'
        ]),
        /**
         * @cfg {String}
         * The unique identifier of the view
         */
        id: 'generic_edit',
        tier: 1,
        store: null,
        /**
         * @property {Object}
         * The layout definition that constructs the detail view with sections and rows
         */
        layout: null,
        /**
         * @cfg {String/Object}
         * May be used for verifying the view is accessible for creating entries
         */
        insertSecurity: false,
        /**
         * @cfg {String/Object}
         * May be used for verifying the view is accessible for editing entries
         */
        updateSecurity: false,
        /**
         * @property {String}
         * The customization identifier for this class. When a customization is registered it is passed
         * a path/identifier which is then matched to this property.
         */
        customizationSet: 'edit',
        /**
         * @property {Object}
         * Collection of the fields in the layout where the key is the `name` of the field.
         */
        fields: null,

        /**
         * @property {String}
         * ARIA label text in the default "save" toolbar button
         */
        saveText: 'Save',
        /**
         * @property {String}
         * ARIA label text in the default "cancel" toolbar button
         */
        cancelText: 'Cancel',
        /**
         * @cfg {String}
         * Default title text shown in the top toolbar
         */
        titleText: 'Edit',
        /**
         * @property {String}
         * ARIA label text for a collapsible section header
         */
        toggleCollapseText: 'toggle collapse',
        /**
         * @cfg {String}
         * The text placed in the header when there are validation errors
         */
        validationSummaryText: 'Validation Summary',
        /**
         * @property {String}
         * Default text used in the section header
         */
        detailsText: 'Details',
        /**
         * @property {String}
         * Text shown while the view is loading.
         */
        loadingText: 'loading...',
        /**
         * @property {String}
         * Text alerted to user when any server error occurs.
         */
        requestErrorText: 'A server error occurred while requesting data.',

        /**
         * Extends constructor to initialze `this.fields` to {}
         * @param o
         */
        constructor: function(o) {
            this.fields = {};
        },
        /**
         * When the app is started this fires, the Edit view renders its layout immediately, then
         * renders each field instance and calls their `startup()`.
         *
         * On refresh it will clear the values, but leave the layout intact.
         *
         */
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
        /**
         * Sets and returns the toolbar item layout definition, this method should be overriden in the view
         * so that you may define the views toolbar items.
         *
         * By default it adds a save button bound to `this.save()` and cancel that fires `ReUI.back()`
         *
         * @return {Object} this.tools
         * @template
         */
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
        /**
         * Handler for a fields on show event.
         *
         * Removes the row-hidden css class.
         *
         * @param {_Field} field Field instance that is being shown
         */
        _onShowField: function(field) {
            domClass.remove(field.containerNode, 'row-hidden');
        },
        /**
         * Handler for a fields on hide event.
         *
         * Adds the row-hidden css class.
         *
         * @param {_Field} field Field instance that is being hidden
         */
        _onHideField: function(field) {
            domClass.add(field.containerNode, 'row-hidden');
        },
        /**
         * Handler for a fields on enable event.
         *
         * Removes the row-disabled css class.
         *
         * @param {_Field} field Field instance that is being enabled
         */
        _onEnableField: function(field) {
            domClass.remove(field.containerNode, 'row-disabled');
        },
        /**
         * Handler for a fields on disable event.
         *
         * Adds the row-disabled css class.
         *
         * @param {_Field} field Field instance that is being disabled
         */
        _onDisableField: function(field) {
            domClass.add(field.containerNode, 'row-disabled');
        },
        /**
         * Toggles the collapsed state of the section.
         * @param {Event} evt Mouse event.
         * @param {HTMLElement} node Node that initiated the event.
         */
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
        /**
         * Sets and returns the Edit view layout by following a standard for section and field:
         *
         * The `this.layout` itself is an array of section objects where a section object is defined as such:
         *
         *     {
         *        name: 'String', // Required. unique name for identification/customization purposes
         *        title: 'String', // Required. Text shown in the section header
         *        children: [], // Array of child row objects
         *     }
         *
         * A child row object has:
         *
         *     {
         *        name: 'String', // Required. unique name for identification/customization purposes
         *        property: 'String', // Optional. The SData property of the current entity to bind to
         *        label: 'String', // Optional. Text shown in the label to the left of the property
         *        type: 'String', // Required. The field type as registered with the FieldManager.
         *        // Examples of type: 'text', 'decimal', 'date', 'lookup', 'select', 'duration'
         *        'default': value // Optional. If defined the value will be set as the default "unmodified" value (not dirty).
         *     }
         *
         * All further properties are set by their respective type, please see the individual field for
         * its configurable options.
         *
         * @return {Object[]} Edit layout definition
         */
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
        /**
         * ApplyContext is called during {@link #processTemplateEntry processTemplateEntry} and is
         * intended as a hook for when you are inserting a new entry (not editing) and wish to apply
         * values from context, ie, from a view in the history.
         *
         * The cycle of a template values is (first to last, last being the one that overwrites all)
         *
         * 1\. Set the values of the template SData response
         * 2\. Set any field defaults (the fields `default` property)
         * 3\. ApplyContext is called
         * 4\. If `this.options.entry` is defined, apply those values
         *
         * @param templateEntry
         */
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
        /**
         * Loops all fields and calls its `clearValue()`.
         */
        clearValues: function() {
            for (var name in this.fields)
            {
                this.fields[name].clearValue();
            }
        },
        /**
         * Sets the given values by looping the fields and checking if the field property matches
         * a key in the passed values object (after considering a fields `applyTo`).
         *
         * The value set is then passed the initial state, true for default/unmodified/clean and false
         * for dirty or altered.
         *
         * @param {Object} values SData entry, or collection of key/values where key matches a fields property attribute
         * @param {Boolean} initial Initial state of the value, true for clean, false for dirty
         */
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
        /**
         * Retrieves the value from every field, skipping the ones excluded, and merges them into a
         * single payload with the key being the fields `property` attribute, taking into consideration `applyTo` if defined.
         *
         * If all is passed as true, it also grabs hidden and unmodified (clean) values.
         *
         * @param {Boolean} all True to also include hidden and unmodified values.
         * @return {Object} A single object payload with all the values.
         */
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
        /**
         * Loops and gathers the validation errors returned from each field and adds them to the
         * validation summary area. If no errors, removes the validation summary.
         * @return {Boolean/Object[]} Returns the array of errors if present or false for no errors.
         */
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
        /**
         * Gathers the values for the entry to send back and returns the appropriate payload for
         * creating or updating.
         * @return {Object} Entry/payload
         */
        createItem: function() {
            var values = this.getValues();

            return this.inserting
                ? this.createItemForUpdate(values)
                : this.createItemForInsert(values);
        },
        /**
         * Takes the values object and adds the needed propertiers for updating.
         * @param {Object} values
         * @return {Object} Object with properties for updating
         */
        createItemForUpdate: function(values) {
            return values;
        },
        /**
         * Takes the values object and adds the needed propertiers for creating/inserting.
         * @param {Object} values
         * @return {Object} Object with properties for inserting
         */
        createItemForInsert: function(values) {
            return values;
        },
        /**
         * Determines if the form is currently busy/disabled
         * @return {Boolean}
         */
        isFormDisabled: function() {
            return this.busy;
        },
        /**
         * Disables the form by setting busy to true and disabling the toolbar.
         */
        disable: function() {
            this.busy = true;

            topic.publish('/app/toolbar/toggle', 'top', false);

            domClass.add(this.domNode, 'is-busy');
        },
        /**
         * Enables the form by setting busy to false and enabling the toolbar
         */
        enable: function() {
            this.busy = false;

            topic.publish('/app/toolbar/toggle', 'top', true);

            domClass.remove(this.domNode, 'is-busy');
        },
        /**
         * Called by `save()` when performing an insert (create).
         * Gathers the values, creates the payload for insert, updates the store.
         */
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
        /**
         * Called by save() when performing an update (edit).
         * Gathers the values, creates the payload for update, and alters the store.
         */
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
        /**
         * Creates the markup by applying the `validationSummaryItemTemplate` to each item in `this.errors`
         * then sets the combined result into the summary validation node and sets the styling to visible
         */
        showValidationSummary: function() {
            var content = [];                        

            for (var i = 0; i < this.errors.length; i++)
                content.push(this.validationSummaryItemTemplate.apply(this.errors[i], this.fields[this.errors[i].name]));

            this.set('validationContent', content.join(''));

            domClass.add(this.domNode, 'has-error');

            this.onContentChange();
        },
        /**
         * Removes the summary validation visible styling and empties its contents of error markup
         */
        hideValidationSummary: function() {
            domClass.remove(this.domNode, 'has-error');
            this.set('validationContent', '');
        },
        /**
         * Handler for the save toolbar action.
         *
         * First validates the forms, showing errors and stoping saving if found.
         * Then calls either {@link #insert insert} or {@link #update update} based upon `this.inserting`.
         *
         */
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
        /**
         * Extends the getContext function to also include the `resourceKind` of the view, `insert`
         * state and `key` of the entry (false if inserting)
         */
        getContext: function() {
            /* todo: move SData options into mixin */
            var store = this.get('store'),
                options = this.options,
                id = options.insert ? false : store && store.getIdentity(options.item || options.entry);

            return lang.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind,
                id: id
            });
        },
        /**
         * Wrapper for detecting security for update mode or insert mode
         * @param {String} access Can be either "update" or "insert"
         */
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
        /**
         * Extends beforeTransitionTo to add the loading styling if refresh is needed
         */
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
        /**
         * Extends refreshRequiredFor to return false if we already have the key the options is passing
         * @param {Object} options Navigation options from previous view
         * @return {Boolean}
         */
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
        /**
         * Load first clears out any variables set to previous data such as `this.entry` and `this.changing`.
         *
         * The mode of the Edit view is set and determined via `this.options.insert`, and the views values are cleared.
         *
         * Lastly it makes the appropiate data request:
         *
         * 1\. If we are inserting and passed a `template`, process the template. No request.
         * 2\. If we are inserting and not passed a `template`, request a template.
         * 3\. If we are not inserting and passed an `entry`, process the `entry` and process `changes`.
         * 4\. If we are not inserting and not passed an `entry`, but were passed a `key`, request the keys detail and use that as an entry.
         *
         */
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