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

define('Sage/Platform/Mobile/List', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/connect',
    'dojo/_base/Deferred', /* todo: use `dojo/when` in 1.8 */
    'dojo/query',
    'dojo/NodeList-manipulate',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom',
    'dojo/string',
    'dojo/topic',
    './View',
    './ErrorManager',
    './ScrollContainer',
    './SearchWidget',
    './TitleBar',
    'argos!scene',
    'argos!customizations'
], function(
    declare,
    lang,
    array,
    connect,
    Deferred,
    query,
    queryManipulate,
    domClass,
    domConstruct,
    dom,
    string,
    topic,
    View,
    ErrorManager,
    ScrollContainer,
    SearchWidget,
    TitleBar,
    scene,
    customizations
) {

    var SelectionModel = declare('Sage.Platform.Mobile.SelectionModel', null, {
        count: 0,
        selections: null,
        clearAsDeselect: true,
        _fireEvents: true,
        constructor: function(options) {
            this.selections = {};
            
            lang.mixin(this, options);
        },
        suspendEvents: function() {
            this._fireEvents = false;
        },
        resumeEvents: function() {
            this._fireEvents = true;
        },
        onSelect: function(key, data, tag, self) {
        },
        onDeselect: function(key, data, tag, self) {
        },
        onClear: function(self) {
        },
        select: function(key, data, tag) {
            if (!this.selections.hasOwnProperty(key))
            {
                this.selections[key] = {data: data, tag: tag};
                this.count++;
                if (this._fireEvents) this.onSelect(key, data, tag, this);
            }
        },
        toggle: function(key, data, tag) {
            if (this.isSelected(key))
                this.deselect(key);
            else
                this.select(key, data, tag);
        },
        deselect: function(key) {
            if (this.selections.hasOwnProperty(key))
            {
                var selection = this.selections[key];

                delete this.selections[key];
                this.count--;

                if (this._fireEvents)
                    this.onDeselect(key, selection.data, selection.tag, this);
            }
        },
        clear: function() {
            if (this.clearAsDeselect)
            {
                for (var key in this.selections) this.deselect(key);
            }
            else
            {
                this.selections = {};
                this.count = 0;
            }

            if (this._fireEvents) this.onClear(this);
        },
        isSelected: function(key) {
            return !!this.selections[key];
        },
        getSelectionCount: function() {
            return this.count;
        },
        getSelections: function() {
            return this.selections;
        },
        getSelectedKeys: function() {
            var keys = [];
            for (var key in this.selections)
                if (this.selections.hasOwnProperty(key))
                    keys.push(key);
            return keys;
        }
    });

    var ConfigurableSelectionModel = declare('Sage.Platform.Mobile.ConfigurableSelectionModel', [SelectionModel], {
        singleSelection: false,
        useSingleSelection: function(val) {
            if (this.singleSelection != !!val) //false != undefined = true, false != !!undefined = false
            {
                this.singleSelection = val;
                this.clear();
            }
        },
        select: function(key, data, tag) {
            if (this.singleSelection)
            {
                if (!this.isSelected(key) || (this.count >= 1)) this.clear();
            }

            this.inherited(arguments);
        }
    });

    var List = declare('Sage.Platform.Mobile.List', [View], {
        events: {
            'click': true
        },
        components: [
            {name: 'search', type: SearchWidget, attachEvent: 'onQuery:_onSearchQuery,onClear:_onSearchClear'},
            {name: 'fix', content: '<a href="#" class="android-6059-fix">fix for android issue #6059</a>'},
            {name: 'scroller', type: ScrollContainer, subscribeEvent: 'onContentChange:onContentChange', components: [
                {name: 'scroll', tag: 'div', components: [
                    {name: 'empty', tag: 'div', attrs: {'class': 'list-empty'}, attachPoint: 'emptySelectionNode', components: [
                        {name: 'emptyButton', content: Simplate.make('<button class="button" data-action="emptySelection"><span>{%: $.emptySelectionText %}</span></button>')}
                    ]},
                    {name: 'content', tag: 'ul', attrs: {'class': 'list-content'}, attachPoint: 'contentNode'},
                    {name: 'more', tag: 'div', attrs: {'class': 'list-more'}, components: [
                        {name: 'moreRemaining', tag: 'span', attrs: {'class': 'list-remaining'}, attachPoint: 'remainingContentNode'},
                        {name: 'moreButton', content: Simplate.make('<button class="button" data-action="more"><span>{%: $.moreText %}</span></button>')}
                    ]},
                    {name: 'list-actions', tag: 'li', attrs: {'class': 'actions-row'}, attachPoint: 'actionsNode'}
                ]}
            ]}
        ],
        baseClass: 'view list has-search-header',
        contentNode: null,
        remainingContentNode: null,
        emptySelectionNode: null,
        remainingNode: null,
        moreNode: null,
        _setListContentAttr: {node: 'contentNode', type: 'innerHTML'},
        _setRemainingContentAttr: {node: 'remainingContentNode', type: 'innerHTML'},
        /**
         * The template used to render the loading message when the view is requesting more data.
         *
         * The default template uses the following properties:
         *
         *      name                description
         *      ----------------------------------------------------------------
         *      loadingText         The text to display while loading.
         */
        loadingTemplate: new Simplate([
            '<li class="loading-indicator"><div>{%: $.loadingText %}</div></li>'
        ]),
        /**
         * The template used to render a row in the view.  This template includes {@link #itemTemplate}.
         */
        rowTemplate: new Simplate([
            '<li data-action="activateEntry" data-key="{%= $.$key %}" data-descriptor="{%: $.$descriptor %}">',
            '<button data-action="selectEntry" class="list-item-selector button">',
            '<img src="{%= $$.icon || $$.selectIcon %}" class="icon" />',
            '</button>',
            '<div class="list-item-content">{%! $$.itemTemplate %}</div>',
            '</li>'
        ]),
        /**
         * The template used to render the content of a row.  This template is not directly rendered, but is
         * included in {@link #rowTemplate}.
         *
         * This property should be overridden in the derived class.
         */
        itemTemplate: new Simplate([
            '<h3>{%: $.$descriptor %}</h3>',
            '<h4>{%: $.$key %}</h4>'
        ]),
        /**
         * The template used to render a message if there is no data available.
         * The default template uses the following properties:
         *
         *      name                description
         *      ----------------------------------------------------------------
         *      noDataText          The text to display if there is no data.
         */
        noDataTemplate: new Simplate([
            '<li class="no-data">',
            '<h3>{%= $.noDataText %}</h3>',
            '</li>'
        ]),
        /**
         * The template used to render a single action item (button)
         * The default template uses the following properties
         *
         *      name                description
         *      ----------------------------------------------------------------
         *      title               Used for the ARIA label
         *      icon                Path to the icon to use for the action item
         *      label               Text shown beneath the icon
         */
        listActionItemTemplate: new Simplate([
            '<button data-action="invokeActionItem" data-id="{%= $.actionIndex %}" aria-label="{%: $.title || $.id %}">',
            '<img src="{%= $.icon %}" alt="{%= $.id %}" />',
            '<label>{%: $.label %}</label>',
            '</button>'
        ]),
        /**
         * @cfg {String} id
         * The id for the view, and it's main DOM element.
         */
        id: 'generic_list',
        /**
         * The property containing the key for the items in the data store.
         */
        tier: 0,
        store: null,
        /**
         * The page size (defaults to 20).
         * @type {Number}
         */
        pageSize: 20,
        /**
         * True if search is enabled (defaults to true).
         */
        enableSearch: true,
        /**
         * True to hide the search bar (defaults to false).
         * @type {Boolean}
         */
        hideSearch: false,
        /**
         * True to enable action based panel (defaults to false).
         * @type {Boolean}
         */
        enableActions: false,
        /**
         * True to allow selection in the view (defaults to false).
         * @type {Boolean}
         */
        allowSelection: false,
        /**
         * True to clear the selection when the view is shown (defaults to true).
         * @type {Boolean}
         */
        autoClearSelection: true,
        /**
         * The id of the detail view to show when a row is clicked.
         * @type {?String}
         */
        detailView: null,
        /**
         * The view to show, either an id or an instance, if there is no {@link #insertView} specified, when
         * the {@link #navigateToInsertView} action is invoked.
         * @type {?(String|Sage.Platform.Mobile.View)}
         */
        editView: null,
        /**
         * The view to show, either an id or an instance, when the {@link #navigateToInsertView} action is invoked.
         * @type {?(String|Sage.Platform.Mobile.View)}
         */
        insertView: null,
        /**
         * The view to show, either an id or an instance, when the {@link #navigateToContextView} action is invoked.
         * @type {?(String|Sage.Platform.Mobile.View)}
         */
        contextView: false,
        /**
         * The built hash tag layout.
         */
        hashTags: null,
        /**
         * A dictionary of hash tag search queries.  The key is the hash tag, without the symbol, and the value is
         * either a query string, or a function that returns a query string.
         * @type {?Object}
         */
        hashTagQueries: null,
        /**
         * The regular expression used to determine if a search query is a custom search expression.  A custom search
         * expression is not processed, and directly passed to SData.
         * @type {Object}
         */
        customSearchRE: /^#!/,
        /**
         * The regular expression used to determine if a search query is a hash tag search.
         * @type {Object}
         */
        hashTagSearchRE: /(?:#|;|,|\.)(\w+)/g,
        /**
         * The text displayed in the more button.
         * @type {String}
         */
        moreText: 'Retrieve More Records',
        /**
         * The text displayed in the emptySelection button.
         * @type {String}
         */
        emptySelectionText: 'None',
        /**
         * The text displayed as the default title.
         * @type {String}
         */
        titleText: 'List',
        /**
         * The format string for the text displayed for the remaining record count.  This is used in a {@link String#format} call.
         * @type {String}
         */
        remainingText: '${0} records remaining',
        /**
         * The text displayed on the cancel button.
         * @type {String}
         * @deprecated
         */
        cancelText: 'Cancel',
        /**
         * The text displayed on the insert button.
         * @type {String}
         * @deprecated
         */
        insertText: 'New',
        /**
         * The text displayed when no records are available.
         * @type {String}
         */
        noDataText: 'no records',
        /**
         * The text displayed when data is being requested.
         * @type {String}
         */
        loadingText: 'Loading...',
        searchText: 'Search',
        /**
         * The text displayed when a data request fails.
         * @type {String}
         */
        requestErrorText: 'A server error occurred while requesting data.',
        customizationSet: 'list',
        actionsNode: null,
        _selectionModel: null,
        _selectionConnects: null,
        _setSelectionModelAttr: function(selectionModel) {
            if (this._selectionConnects) array.forEach(this._selectionConnects, this.disconnect, this);

            this._selectionModel = selectionModel;
            this._selectionConnects = [];

            if (this._selectionModel)
            {
                this._selectionConnects.push(
                    this.connect(this._selectionModel, 'onSelect', this._onSelectionModelSelect),
                    this.connect(this._selectionModel, 'onDeselect', this._onSelectionModelDeselect),
                    this.connect(this._selectionModel, 'onClear', this._onSelectionModelClear)
                );
            }
        },
        _getSelectionModelAttr: function() {
            return this._selectionModel;
        },
        onStartup: function() {
            this.inherited(arguments);

            if (this._selectionModel == null)
                this.set('selectionModel', new ConfigurableSelectionModel());

            this.subscribe('/app/refresh', this._onRefresh);

            domClass.toggle(this.domNode, 'has-search-header', this.hideSearch);

            if (this.searchText && this.enableSearch)
                this.$.search.setLabel(this.searchText);

            var customizationSet = customizations();
            this.createActions(customizationSet.apply(customizationSet.toPath('actions', null, this.id), this.createActionLayout()));

            this.clear(true);
        },
        onDestroy: function() {
            this.inherited(arguments);

            delete this.store;

            if (this._selectionConnects)
            {
                array.forEach(this._selectionConnects, this.disconnect, this);

                delete this._selectionConnects;
                delete this._selectionModel;
            }
        },
        _getStoreAttr: function() {
            return this.store || (this.store = this.createStore());
        },
        createToolLayout: function() {
            return this.tools || (this.tools = {
                'top': [{
                    id: 'new',
                    action: 'navigateToInsertView',
                    security: App.getViewSecurity(this.insertView, 'insert')
                }]
            });
        },
        createActionLayout: function() {
            return this.actions || {};
        },
        createActions: function(actions) {
            for (var i = 0; i < actions.length; i++)
            {
                var action = actions[i],
                    options = {
                        actionIndex: i,
                        hasAccess: (action.security && App.hasAccessTo(this.expandExpression(action.security))) || true
                    },
                    actionTemplate = action.template || this.listActionItemTemplate;

                lang.mixin(action, options);
                domConstruct.place(actionTemplate.apply(action, action.id), this.actionsNode, 'last');
            }

            this.actions = actions;
        },
        invokeActionItem: function(parameters, evt, node) {
            var index = parameters['id'],
                action = this.actions[index],
                selectedItems = this.get('selectionModel').getSelections(),
                selection = null;

            if (!action.isEnabled) return;

            for (var key in selectedItems)
            {
                selection = selectedItems[key];
                break;
            }

            if (action['fn'])
                action['fn'].call(action['scope'] || this, action, selection);
            else
            if (action['action'])
                if (this.hasAction(action['action']))
                    this.invokeAction(action['action'], action, selection);
        },
        checkActionState: function() {
            var selectedItems = this.get('selectionModel').getSelections(),
                selection = null;

            for (var key in selectedItems)
            {
                selection = selectedItems[key];
                break;
            }

            for (var i = 0; i < this.actions.length; i++)
            {
                var action = this.actions[i];

                action.isEnabled = (typeof action['enabled'] === 'undefined')
                    ? true
                    : this.expandExpression(action['enabled'], action, selection);

                if (!action.hasAccess)
                    action.isEnabled = false;

                domClass.toggle(this.actionsNode.childNodes[i], 'toolButton-disabled', !action.isEnabled);
            }

        },
        showActionPanel: function(rowNode) {
            this.checkActionState();

            domClass.add(rowNode, 'list-action-selected');
            domConstruct.place(this.actionsNode, rowNode, 'after');

            if (this.actionsNode.offsetTop + this.actionsNode.clientHeight + 48 > document.documentElement.clientHeight)
                this.actionsNode.scrollIntoView(false);
        },
        setSource: function(source) {
            lang.mixin(source, {
                resourceKind: this.resourceKind
            });

            this.options.source = source;
        },
        hideActionPanel: function(rowNode) {
            domClass.remove(rowNode, 'list-action-selected');
        },
        isNavigationDisabled: function() {
            return ((this.options && this.options.selectionOnly) || (this.selectionOnly));
        },
        isSelectionDisabled: function() {
            return !((this.options && this.options.selectionOnly) || this.enableActions || this.allowSelection);
        },
        _onSelectionModelSelect: function(key, data, tag) {
            var node = dom.byId(tag) || query('li[data-key="'+key+'"]', this.domNode)[0];
            if (!node) return;

            if (this.enableActions)
            {
                this.showActionPanel(node);
                return;
            }

            domClass.add(node, 'list-item-selected');
        },
        _onSelectionModelDeselect: function(key, data, tag) {
            var node = dom.byId(tag) || query('li[data-key="'+key+'"]', this.domNode)[0];
            if (!node) return;

            if (this.enableActions)
            {
                this.hideActionPanel(node);
                return;
            }

            domClass.remove(node, 'list-item-selected');
        },
        _onSelectionModelClear: function() {
        },
        _loadPreviousSelections: function() {
            var previousSelections = this.options && this.options.previousSelections;
            if (previousSelections)
            {
                for (var i = 0; i < previousSelections.length; i++)
                {
                    var row = query((string.substitute('[data-key="${0}"], [data-descriptor="${0}"]', [previousSelections[i]])), this.contentNode)[0];

                    if (row)
                        this.selectEntry(null, row);
                }
            }
        },
        _onRefresh: function(options) {
            if (this.resourceKind && options.resourceKind === this.resourceKind)
            {
                this.refreshRequired = true;
            }
        },
        selectEntry: function(evt, node) {
            var row = query(node).closest('[data-key]')[0],
                key = row ? row.getAttribute('data-key') : false;

            if (this._selectionModel && key)
                this._selectionModel.toggle(key, this.items[key], row);

            if (this.options.singleSelect && this.options.singleSelectAction && !this.enableActions)
                this.invokeSingleSelectAction();
        },
        activateEntry: function(evt, node) {
            var descriptor = node && node.getAttribute('data-descriptor'),
                key = node && node.getAttribute('data-key');
            if (key)
            {
                if (this._selectionModel && this.isNavigationDisabled())
                {
                    this._selectionModel.toggle(key, this.items[key] || descriptor, node);

                    if (this.options.singleSelect && this.options.singleSelectAction)
                    {
                        this.invokeSingleSelectAction();
                    }
                }
                else
                {
                    this.navigateToDetailView(key, descriptor);
                }
            }
        },
        invokeSingleSelectAction: function() {
            topic.publish('/app/toolbar/invoke', this.options.singleSelectAction);

            if (this.autoClearSelection)
                this._selectionModel.clear();
        },
        _getHashTagsAttr: function() {
            var customizationSet = customizations();
            return customizationSet.apply(customizationSet.toPath(this.customizationSet, 'hashTagQueries', this.id), this.createHashTagQueryLayout());
        },
        _setHashTagsAttr: function(value) {
            this.hashTags = value;
        },
        createHashTagQueryLayout: function() {
            if (this.hashTags) return this.hashTags;

            var layout = [];

            for (var name in this.hashTagQueries)
            {
                layout.push({
                    'key': name,
                    'tag': (this.hashTagQueriesText && this.hashTagQueriesText[name]) || name,
                    'query': this.hashTagQueries[name]
                });
            }

            return (this.hashTags = layout);
        },
        formatSearchQuery: function(query) {
            return false;
        },
        formatHashTagQuery: function(query) {
            return false;
        },
        _onSearchQuery: function(query) {
            if (query)
            {
                if (this.hashTagSearchRE.test(query))
                {
                    this.query = this.formatHashTagQuery(query);
                }
                else
                {
                    this.query = this.formatSearchQuery(query);
                }
            }
            else
            {
                this.query = false;
            }

            this.clear(false);
            this._requestData();
        },
        _onSearchClear: function() {

        },
        createStore: function() {
            return null;
        },
        navigateToRelatedView:  function(action, selection, viewId, whereQueryFmt) {
            var options = {};

            if (whereQueryFmt && selection)
                options['where'] = string.substitute(whereQueryFmt, [selection.data['$key']]);

            scene().showView(viewId, options);
        },
        navigateToDetailView: function(key, descriptor) {
            scene().showView(this.detailView, {
                descriptor: descriptor,
                key: key
            });
        },
        navigateToInsertView: function() {
            scene().showView(this.insertView || this.editView, {
                returnTo: this.id,
                insert: true
            });
        },
        onContentChange: function() {
        },
        _processItem: function(item) {
            return item;
        },
        _processData: function(items) {
            var store = this.get('store'),
                count = items.length;
            if (count > 0)
            {
                var output = [];

                for (var i = 0; i < count; i++)
                {
                    var item = this._processItem(items[i]);

                    this.items[store.getIdentity(item)] = item;

                    output.push(this.rowTemplate.apply(item, this));
                }

                if (output.length > 0) domConstruct.place(output.join(''), this.contentNode, 'last');
            }
        },
        _onQueryComplete: function(queryResults, items) {
            var start = this.position;

            Deferred.when(queryResults.total, lang.hitch(this, this._onQueryTotal));

            /* todo: move to a more appropriate location */
            if (this.options && this.options.allowEmptySelection) domClass.add(this.domNode, 'has-empty');

            this._processData(items);

            domClass.remove(this.domNode, 'is-loading');

            /* remove the loading indicator so that it does not get re-shown while requesting more data */
            if (start === 0) domConstruct.destroy(this.loadingIndicatorNode);

            this.onContentChange();
            connect.publish('/app/toolbar/update', []);
        },
        _onQueryTotal: function(size) {
            if (size === 0)
            {
                domConstruct.place(this.noDataTemplate.apply(this), this.contentNode, 'only');
            }
            else
            {
                var remaining = size > -1
                    ? size - (this.position + this.pageSize)
                    : -1;

                if (remaining !== -1)
                    this.set('remainingContent', string.substitute(this.remainingText, [remaining]));

                domClass.toggle(this.domNode, 'has-more', (remaining === -1 || remaining > 0));

                this.position = this.position + this.pageSize;
            }
        },
        _onQueryError: function(queryOptions, error) {
            if (error.aborted)
            {
                this.options = false; // force a refresh
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
                queryOptions = {
                    count: this.pageSize,
                    start: this.position
                };

            this._applyStateToQueryOptions(queryOptions);

            var queryExpression = this._buildQueryExpression() || null,
                queryResults = store.query(queryExpression, queryOptions);

            Deferred.when(queryResults,
                lang.hitch(this, this._onQueryComplete, queryResults),
                lang.hitch(this, this._onQueryError, queryOptions)
            );

            return queryResults;
        },
        _buildQueryExpression: function() {
            return lang.mixin(this.query || {}, this.options.query || this.options.where);
        },
        _applyStateToQueryOptions: function(queryOptions) {

        },
        emptySelection: function() {
            /// <summary>
            ///     Called when the emptySelection/None button is clicked.
            /// </summary>
            this._selectionModel.clear();

            if (App.bars['tbar'])
                App.bars['tbar'].invokeTool({tool: this.options.singleSelectAction}); // invoke action of tool
        },
        refreshRequiredFor: function(options) {
            if (this.options)
            {
                if (options)
                {
                    if (this.expandExpression(this.options.where) != this.expandExpression(options.where)) return true;
                    if (this.expandExpression(this.options.query) != this.expandExpression(options.query)) return true;
                    if (this.expandExpression(this.options.resourceKind) != this.expandExpression(options.resourceKind)) return true;
                    if (this.expandExpression(this.options.resourcePredicate) != this.expandExpression(options.resourcePredicate)) return true;
                }

                return false;
            }
            else
                return this.inherited(arguments);
        },
        getContext: function() {
            return lang.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind
            });
        },
        beforeTransitionTo: function() {
            this.inherited(arguments);

            domClass.toggle(this.domNode, 'has-search-header', !this.hideSearch);
            domClass.toggle(this.domNode, 'has-selectors', !this.isSelectionDisabled());

            if (this._selectionModel && !this.isSelectionDisabled())
                this._selectionModel.useSingleSelection(this.options.singleSelect);

            if (typeof this.options.enableActions !== 'undefined')
                this.enableActions = this.options.enableActions;

            domClass.toggle(this.domNode, 'list-show-actions', this.enableActions);
            if (this.enableActions)
            {
                this._selectionModel.useSingleSelection(true);
            }

            if (this.refreshRequired)
            {
                this.clear();
            }
            else
            {
                // if enabled, clear any pre-existing selections
                if (this._selectionModel && this.autoClearSelection && !this.enableActions)
                    this._selectionModel.clear();
            }
        },
        transitionTo: function() {
            if (this._selectionModel) this._loadPreviousSelections();

            this.inherited(arguments);
        },
        load: function() {
            this.inherited(arguments);

            this._requestData();
        },
        more: function() {
            this._requestData();
        },
        /**
         *
         * @param [all]
         */
        clear: function(all) {
            if (this._selectionModel)
            {
                this._selectionModel.suspendEvents();
                this._selectionModel.clear();
                this._selectionModel.resumeEvents();
            }

            this.items = {};
            this.position = 0;

            if (all !== false)
            {
                this.query = false;

                this.$.search.clear();
            }

            domClass.remove(this.domNode, 'has-more');

            this.loadingIndicatorNode = domConstruct.place(this.loadingTemplate.apply(this), this.contentNode, 'only');

            domClass.add(this.domNode, 'is-loading');
        }
    });

    return List;
});
