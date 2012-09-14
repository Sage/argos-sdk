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
 * A Detail View represents a single record and should display all the info the user may need about the entry.
 *
 * A Detail entry is identified by its key ($key) which is how it requests the data via the SData endpoint.
 *
 * @alternateClassName Detail
 * @extends View
 * @requires format
 * @requires utility
 * @requires ErrorManager
 */
define('Sage/Platform/Mobile/Detail', [
    'dojo',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/string',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/dom-construct',
    'Sage/Platform/Mobile/Format',
    'Sage/Platform/Mobile/Utility',
    'Sage/Platform/Mobile/ErrorManager',
    'Sage/Platform/Mobile/View'
], function(
    dojo,
    declare,
    lang,
    string,
    dom,
    domClass,
    domConstruct,
    format,
    utility,
    ErrorManager,
    View
) {

    return declare('Sage.Platform.Mobile.Detail', [View], {
        /**
         * @property {Object}
         * Creates a setter map to html nodes, namely:
         *
         * * detailContent => contentNode's innerHTML
         *
         */
        attributeMap: {
            detailContent: {node: 'contentNode', type: 'innerHTML'}
        },
        /**
         * @property {Simplate}
         * The template used to render the view's main DOM element when the view is initialized.
         * This template includes loadingTemplate.
         *
         * The default template uses the following properties:
         *
         *      name                description
         *      ----------------------------------------------------------------
         *      id                   main container div id
         *      title                main container div title attr
         *      cls                  additional class string added to the main container div
         *      resourceKind         set to data-resource-kind
         *
         */
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%= $.titleText %}" class="detail panel {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
            '{%! $.loadingTemplate %}',
            '<div class="panel-content" data-dojo-attach-point="contentNode"></div>',
            '</div>'
        ]),
        /**
         * @property {Simplate}
         * HTML shown when no data is available.
         */
        emptyTemplate: new Simplate([
        ]),
        /**
         * @property {Simplate}
         * HTML shown when data is being loaded.
         *
         * `$` => the view instance
         */
        loadingTemplate: new Simplate([
            '<div class="panel-loading-indicator">',
            '<div class="row"><div>{%: $.loadingText %}</div></div>',
            '</div>'
        ]),
        /**
         * @property {Simplate}
         * HTML that starts a new section including the collapsible header
         *
         * `$` => the view instance
         */
        sectionBeginTemplate: new Simplate([
            '<h2 data-action="toggleSection" class="{% if ($.collapsed || $.options.collapsed) { %}collapsed{% } %}">',
            '{%: ($.title || $.options.title) %}<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '{% if ($.list || $.options.list) { %}',
            '<ul class="{%= ($.cls || $.options.cls) %}">',
            '{% } else { %}',
            '<div class="{%= ($.cls || $.options.cls) %}">',
            '{% } %}'
        ]),
        /**
         * @property {Simplate}
         * HTML that ends a section
         *
         * `$` => the view instance
         */
        sectionEndTemplate: new Simplate([
            '{% if ($.list || $.options.list) { %}',
            '</ul>',
            '{% } else { %}',
            '</div>',
            '{% } %}'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for a property in the detail layout
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        propertyTemplate: new Simplate([
            '<div class="row {%= $.cls %}" data-property="{%= $.property || $.name %}">',
            '<label>{%: $.label %}</label>',
            '<span>{%= $.value %}</span>', // todo: create a way to allow the value to not be surrounded with a span tag
            '</div>'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for detail layout items that point to related views, includes a label and links the value text
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        relatedPropertyTemplate: new Simplate([
            '<div class="row {%= $.cls %}">',
            '<label>{%: $.label %}</label>',
            '<span>',
            '<a data-action="activateRelatedEntry" data-view="{%= $.view %}" data-context="{%: $.context %}" data-descriptor="{%: $.descriptor %}">',
            '{%= $.value %}',
            '</a>',
            '</span>',
            '</div>'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for detail layout items that point to related views, displayed as an icon and text
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        relatedTemplate: new Simplate([
            '<li class="{%= $.cls %}">',
            '<a data-action="activateRelatedList" data-view="{%= $.view %}" data-context="{%: $.context %}">',
            '{% if ($.icon) { %}',
            '<img src="{%= $.icon %}" alt="icon" class="icon" />',
            '{% } %}',
            '<span>{%: $.label %}</span>',
            '</a>',
            '</li>'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for detail layout items that fire an action, displayed with label and property value
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        actionPropertyTemplate: new Simplate([
            '<div class="row {%= $.cls %}">',
            '<label>{%: $.label %}</label>',
            '<span>',
            '<a data-action="{%= $.action %}" {% if ($.disabled) { %}data-disable-action="true"{% } %} class="{% if ($.disabled) { %}disabled{% } %}">',
            '{%= $.value %}',
            '</a>',
            '</span>',
            '</div>'
        ]),
        /**
         * @property {Simplate}
         * HTML that is used for detail layout items that fire an action, displayed as an icon and text
         *
         * * `$` => detail layout row
         * * `$$` => view instance
         */
        actionTemplate: new Simplate([
            '<li class="{%= $.cls %}">',
            '<a data-action="{%= $.action %}" {% if ($.disabled) { %}data-disable-action="true"{% } %} class="{% if ($.disabled) { %}disabled{% } %}">',
            '{% if ($.icon) { %}',
            '<img src="{%= $.icon %}" alt="icon" class="icon" />',
            '{% } %}',
            '<label>{%: $.label %}</label>',
            '<span>{%= $.value %}</span>',
            '</a>',
            '</li>'
        ]),
        /**
         * @property {Simplate}
         * HTML that is shown when not available
         *
         * `$` => the view instance
         */
        notAvailableTemplate: new Simplate([
            '<div class="not-available">{%: $.notAvailableText %}</div>'
        ]),
        /**
         * @property {String}
         * The unique identifier of the view
         */
        id: 'generic_detail',
        /**
         * @property {Object}
         * The layout definition that constructs the detail view with sections and rows
         */
        layout: null,
        /**
         * @cfg {String/Object}
         * May be used for verifying the view is accessible
         */
        security: false,
        /**
         * @property {String}
         * The customization identifier for this class. When a customization is registered it is passed
         * a path/identifier which is then matched to this property.
         */
        customizationSet: 'detail',
        /**
         * @property {Boolean}
         * Controls if the view should be exposed
         */
        expose: false,
        /**
         * @deprecated
         */
        editText: 'Edit',
        /**
         * @cfg {String}
         * Default title text shown in the top toolbar
         */
        titleText: 'Detail',
        /**
         * @property {String}
         * Helper string for a basic section header text
         */
        detailsText: 'Details',
        /**
         * @property {String}
         * ARIA label text for a collapsible section header
         */
        toggleCollapseText: 'toggle collapse',
        /**
         * @property {String}
         * Text shown while loading and used in loadingTemplate
         */
        loadingText: 'loading...',
        /**
         * @property {String}
         * Text shown when a server error occurs
         */
        requestErrorText: 'A server error occurred while requesting data.',
        /**
         * @property {String}
         * Text used in the notAvailableTemplate
         */
        notAvailableText: 'The requested entry is not available.',
        /**
         * @cfg {String}
         * The view id to be taken to when the Edit button is pressed in the toolbar
         */
        editView: false,
        /**
         * @property {Object[]}
         * Store for mapping layout options to an index on the HTML node
         */
        _navigationOptions: null,

        /**
         * Extends the dijit widget postCreate to subscribe to the global `/app/refresh` event and clear the view.
         */
        postCreate: function() {
            this.inherited(arguments);
            this.subscribe('/app/refresh', this._onRefresh);
            this.clear();
        },
        /**
         * Sets and returns the toolbar item layout definition, this method should be overriden in the view
         * so that you may define the views toolbar items.
         * @return {Object} this.tools
         * @template
         */
        createToolLayout: function() {
            return this.tools || (this.tools = {
                'tbar': [{
                    id: 'edit',
                    action: 'navigateToEditView',
                    security: App.getViewSecurity(this.editView, 'update')
                }]
            });
        },
        /**
         * Extends the {@link _ActionMixin#invokeAction mixins invokeAction} to stop if `data-disableAction` is true
         * @param name
         * @param {Object} parameters Collection of `data-` attributes from the node
         * @param {Event} evt
         * @param {HTMLElement} el
         */
        invokeAction: function(name, parameters, evt, el) {
            if (parameters && /true/i.test(parameters['disableAction']))
                return;

            return this.inherited(arguments);
        },
        /**
         * Handler for the global `/app/refresh` event. Sets `refreshRequired` to true if the key matches.
         * @param {Object} options The object published by the event.
         * @private
         */
        _onRefresh: function(o) {
            var descriptor = o.data && o.data['$descriptor'];

            if (this.options && this.options.key === o.key)
            {
                this.refreshRequired = true;

                if (descriptor)
                {
                    this.options.title = descriptor;
                    this.set('title', descriptor);
                }
            }
        },
        /**
         * Applies the entries property to a format string
         * @param {Object} entry Data entry
         * @param {String} fmt Where expression to be formatted, `${0}` will be the extracted property.
         * @param {String} property Property name to extract from the entry, may be a path: `Address.City`.
         * @return {String}
         */
        formatRelatedQuery: function(entry, fmt, property) {
            property = property || '$key';
            return string.substitute(fmt, [utility.getValue(entry, property)]);
        },
        /**
         * Toggles the collapsed state of the section.
         * @param {Object} params Collection of `data-` attributes from the source node.
         */
        toggleSection: function(params) {
            var node = dom.byId(params.$source);
            if (node)
                domClass.toggle(node, 'collapsed');
        },
        /**
         * Handler for the related entry action, navigates to the defined `data-view` passing the `data-context`.
         * @param {Object} params Collection of `data-` attributes from the source node.
         */
        activateRelatedEntry: function(params) {
            if (params.context) this.navigateToRelatedView(params.view, parseInt(params.context, 10), params.descriptor);
        },
        /**
         * Handler for the related list action, navigates to the defined `data-view` passing the `data-context`.
         * @param {Object} params Collection of `data-` attributes from the source node.
         */
        activateRelatedList: function(params) {
            if (params.context) this.navigateToRelatedView(params.view, parseInt(params.context, 10), params.descriptor);
        },
        /**
         * Navigates to the defined `this.editView` passing the current `this.entry` as default data.
         * @param {HTMLElement} el
         */
        navigateToEditView: function(el) {
            var view = App.getView(this.editView);
            if (view)
                view.show({entry: this.entry});
        },
        /**
         * Navigates to a given view id passing the options retrieved using the slot index to `this._navigationOptions`.
         * @param {String} id View id to go to
         * @param {Number} slot Index of the context to use in `this._navigationOptions`.
         * @param {String} descriptor Optional descriptor option that is mixed in.
         */
        navigateToRelatedView: function(id, slot, descriptor) {
            var options = this._navigationOptions[slot],
                view = App.getView(id);

            if (descriptor && options) options['descriptor'] = descriptor;

            if (view && options)
                view.show(options);
        },
        /**
         * Creates Sage.SData.Client.SDataSingleResourceRequest instance and sets a number of known properties.
         *
         * List of properties used `this.property/this.options.property`:
         *
         * `/key`, `resourceKind`, `querySelect`, `queryInclude`, `queryOrderBy`, and `contractName`
         *
         * @return {Object} Sage.SData.Client.SDataSingleResourceRequest instance.
         */
        createRequest: function() {
            var request = new Sage.SData.Client.SDataSingleResourceRequest(this.getService());

            /* test for complex selector */
            /* todo: more robust test required? */
            if (/(\s+)/.test(this.options.key))
                request.setResourceSelector(this.options.key);
            else
                request.setResourceSelector(string.substitute("'${0}'", [this.options.key]));

            if (this.resourceKind)
                request.setResourceKind(this.resourceKind);

            if (this.querySelect)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Select, this.querySelect.join(','));

            if (this.queryInclude)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Include, this.queryInclude.join(','));

            if (this.queryOrderBy)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.OrderBy, this.queryOrderBy);

            if (this.contractName)
                request.setContractName(this.contractName);

            return request;
        },
        /**
         * Sets and returns the Detail view layout by following a standard for section and rows:
         *
         * The `this.layout` itself is an array of section objects where a section object is defined as such:
         *
         *     {
         *        name: 'String', // Required. unique name for identification/customization purposes
         *        title: 'String', // Required. Text shown in the section header
         *        list: boolean, // Optional. Default false. Controls if the group container for child rows should be a div (false) or ul (true)
         *        children: [], // Array of child row objects
         *     }
         *
         * A child row object has:
         *
         *     {
         *        name: 'String', // Required. unique name for identification/customization purposes
         *        property: 'String', // Optional. The SData property of the current entity to bind to
         *        label: 'String', // Optional. Text shown in the label to the left of the property
         *        onCreate: function(), // Optional. You may pass a function to be called when the row is added to the DOM
         *        include: boolean, // Optional. If false the row will not be included in the layout
         *        exclude: boolean, // Optional. If true the row will not be included in the layout
         *        template: Simplate, // Optional. Override the HTML Simplate used for rendering the value (not the row) where `$` is the row object
         *        tpl: Simplate, // Optional. Same as template.
         *        renderer: function(), // Optional. Pass a function that receives the current value and returns a value to be rendered
         *        encode: boolean, // Optional. If true it will encode HTML entities
         *        cls: 'String', // Optional. Additional CSS class string to be added to the row div
         *        use: Simplate, // Optional. Override the HTML Simplate used for rendering the row (not value)
         *        provider: function(entry, propertyName), // Optional. Function that accepts the SData entry and the property name and returns the extracted value. By default simply extracts directly.
         *        value: Any // Optional. Provide a value directly instead of binding to SData
         *     }
         *
         * @return {Object[]} Detail layout definition
         */
        createLayout: function() {
            return this.layout || [];
        },
        /**
         * Processes the given layout definition using the SData entry response by rendering and inserting the HTML nodes and
         * firing any onCreate events defined.
         * @param {Object[]} layout Layout definition
         * @param {Object} entry SData response
         */
        processLayout: function(layout, entry) {
            var rows = (layout['children'] || layout['as'] || layout),
                options = layout['options'] || (layout['options'] = {
                    title: this.detailsText
                }),
                sectionQueue = [],
                sectionStarted = false,
                callbacks = [];

            for (var i = 0; i < rows.length; i++) {
                var current = rows[i],
                    section,
                    sectionNode,
                    include = this.expandExpression(current['include'], entry),
                    exclude = this.expandExpression(current['exclude'], entry);

                if (include !== undefined && !include) continue;
                if (exclude !== undefined && exclude) continue;

                if (current['children'] || current['as'])
                {
                    if (sectionStarted)
                        sectionQueue.push(current);
                    else
                        this.processLayout(current, entry);

                    continue;
                }

                if (!sectionStarted)
                {
                    sectionStarted = true;
                    section = domConstruct.toDom(this.sectionBeginTemplate.apply(layout, this) + this.sectionEndTemplate.apply(layout, this));
                    sectionNode = section.childNodes[1];
                    domConstruct.place(section, this.contentNode);
                }

                var provider = current['provider'] || utility.getValue,
                    property = typeof current['property'] == 'string'
                        ? current['property']
                        : current['name'],
                    value = typeof current['value'] === 'undefined'
                        ? provider(entry, property, entry)
                        : current['value'],
                    rendered,
                    formatted;

                if (current['template'] || current['tpl'])
                {
                    rendered = (current['template'] || current['tpl']).apply(value, this);
                    formatted = current['encode'] === true
                        ? format.encode(rendered)
                        : rendered;
                }
                else if (current['renderer'] && typeof current['renderer'] === 'function')
                {
                    rendered = current['renderer'].call(this, value);
                    formatted = current['encode'] === true
                        ? format.encode(rendered)
                        : rendered;
                }
                else
                {
                    formatted = current['encode'] !== false
                        ? format.encode(value)
                        : value;
                }

                var data = lang.mixin({}, {
                    entry: entry,
                    value: formatted,
                    raw: value
                }, current);

                if (current['descriptor'])
                    data['descriptor'] = typeof current['descriptor'] === 'function'
                        ? this.expandExpression(current['descriptor'], entry, value)
                        : provider(entry, current['descriptor']);

                if (current['action'])
                    data['action'] = this.expandExpression(current['action'], entry, value);

                var hasAccess = App.hasAccessTo(current['security']);
                if (current['security'])
                    data['disabled'] = !hasAccess;

                if (current['disabled'] && hasAccess)
                    data['disabled'] = this.expandExpression(current['disabled'], entry, value);

                if (current['view'])
                {
                    var context = lang.mixin({}, current['options']);
                    if (current['key'])
                        context['key'] = typeof current['key'] === 'function'
                            ? this.expandExpression(current['key'], entry)
                            : provider(entry, current['key']);
                    if (current['where'])
                        context['where'] = this.expandExpression(current['where'], entry);
                    if (current['resourceKind'])
                        context['resourceKind'] = this.expandExpression(current['resourceKind'], entry);
                    if (current['resourceProperty'])
                        context['resourceProperty'] = this.expandExpression(current['resourceProperty'], entry);
                    if (current['resourcePredicate'])
                        context['resourcePredicate'] = this.expandExpression(current['resourcePredicate'], entry);

                    data['view'] = current['view'];
                    data['context'] = (this._navigationOptions.push(context) - 1);
                }

                // priority: use > (relatedPropertyTemplate | relatedTemplate) > (actionPropertyTemplate | actionTemplate) > propertyTemplate
                var useListTemplate = (layout['list'] || options['list']),
                    template = current['use']
                        ? current['use']
                        : current['view']
                            ? useListTemplate
                                ? this.relatedTemplate
                                : this.relatedPropertyTemplate
                            : current['action']
                                ? useListTemplate
                                    ? this.actionTemplate
                                    : this.actionPropertyTemplate
                                : this.propertyTemplate;

                var rowNode = domConstruct.place(template.apply(data, this), sectionNode);

                if(current['onCreate'])
                    callbacks.push({row: current, node: rowNode, value: value, entry: entry});
            }

            for (var i = 0; i < callbacks.length; i++)
            {
                var item = callbacks[i];
                item.row['onCreate'].apply(this, [item.row, item.node, item.value, item.entry]);
            }

            for (var i = 0; i < sectionQueue.length; i++)
            {
                var current = sectionQueue[i];

                this.processLayout(current, entry);
            }
        },
        /**
         * Saves the SData response to `this.entry` and invokes {@link #processLayout processLayout} by passing the customized
         * layout definition. If no entry is provided, empty the screen.
         * @param {Object} entry SData response
         */
        processEntry: function(entry) {
            this.entry = entry;

            if (this.entry)
            {
                this.processLayout(this._createCustomizedLayout(this.createLayout()), this.entry);
            }
            else
            {
                this.set('detailContent', '');
            }
        },
        /**
         * Handler when an error occurs while request data from the SData endpoint.
         * @param {Object} response The response object.
         * @param {Object} o The options that were passed when creating the Ajax request.
         */
        onRequestDataFailure: function(response, o) {
            if (response && response.status == 404)
            {
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'last');
            }
            else
            {
                alert(string.substitute(this.requestErrorText, [response, o]));
                ErrorManager.addError(response, o, this.options, 'failure');
            }

            domClass.remove(this.domNode, 'panel-loading');
        },
        /**
         * Handler when an a request is aborted from an SData endpoint.
         *
         * Clears the `this.options` object which will by default force a refresh of the view.
         *
         * @param {Object} response The response object.
         * @param {Object} o The options that were passed when creating the Ajax request.
         */
        onRequestDataAborted: function(response, o) {
            this.options = false; // force a refresh
            ErrorManager.addError(response, o, this.options, 'aborted');
            domClass.remove(this.domNode, 'panel-loading');
        },
        /**
         * Handler when a request to SData is successful
         * @param {Object} entry The SData response
         */
        onRequestDataSuccess: function(entry) {
            this.processEntry(entry);
            domClass.remove(this.domNode, 'panel-loading');
        },
        /**
         * Initiates the SData request.
         */
        requestData: function() {
            domClass.add(this.domNode, 'panel-loading');

            var request = this.createRequest();
            if (request)
                request.read({
                    success: this.onRequestDataSuccess,
                    failure: this.onRequestDataFailure,
                    aborted: this.onRequestDataAborted,
                    scope: this
                });
        },
        /**
         * Determines if the view should be refresh by inspecting and comparing the passed navigation option key with current key.
         * @param {Object} options Passed navigation options.
         * @return {Boolean} True if the view should be refreshed, false if not.
         */
        refreshRequiredFor: function(options) {
            if (this.options) {
                if (options) {
                    if (this.options.key !== options.key) return true;
                }
                return false;
            }
            else
                return this.inherited(arguments);
        },
        /**
         * Extends the {@link View#activate parent implementation} to set the nav options title attribute to the descriptor
         * @param tag
         * @param data
         */
        activate: function(tag, data) {
            var options = data && data.options;
            if (options && options.descriptor)
                options.title = options.title || options.descriptor;

            this.inherited(arguments);
        },
        /**
         * Extends the {@link View#show parent implementation} to set the nav options title attribute to the descriptor
         * @param tag
         * @param data
         */
        show: function(options) {
            if (options && options.descriptor)
                options.title = options.title || options.descriptor;

            this.inherited(arguments);
        },
        /**
         * Returns the view key
         * @return {String} View key
         */
        getTag: function() {
            return this.options && this.options.key;
        },
        /**
         * Extends the {@link View#getContext parent implementation} to also set the resourceKind, key and descriptor
         * @return {Object} View context object
         */
        getContext: function() {
            return lang.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind,
                key: this.options.key,
                descriptor: this.options.descriptor
            });
        },
        /**
         * Extends the {@link View#beforeTransitionTo parent implementation} to also clear the view if `refreshRequired` is true
         * @return {Object} View context object
         */
        beforeTransitionTo: function() {
            this.inherited(arguments);

            if (this.refreshRequired)
            {
                this.clear();
            }
        },
        /**
         * If a security breach is detected it sets the content to the notAvailableTemplate, otherwise it calls
         * {@link #requestData requestData} which starts the process sequence.
         */
        refresh: function() {
            if (this.security && !App.hasAccessTo(this.expandExpression(this.security)))
            {
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'last');
                return;
            }

            this.requestData();
        },
        /**
         * Clears the view by replacing the content with the empty template and emptying the stored row contexts.
         */
        clear: function() {
            this.set('detailContent', this.emptyTemplate.apply(this));

            this._navigationOptions = [];
        }
    });
});
