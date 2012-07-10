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
    'dojo/query',
    'dojo/NodeList-manipulate',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom',
    'dojo/string',
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
    query,
    queryManipulate,
    domClass,
    domConstruct,
    dom,
    string,
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

    var parseOrderByRE = /((?:\w+)(?:\.\w+)?)(?:\s+(asc|desc))?/g,
        parseOrderBy = function(expression) {
            if (typeof expression !== 'string') return expression;

            var match,
                result = [];

            while (match = parseOrderByRE.exec(expression))
            {
                result.push({
                    attribute: match[1],
                    descending: match[2] && match[2].toLowerCase() == 'desc'
                });
            }

            return result;
        };

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
                        {name: 'moreButton', content: Simplate.make('<button class="button" data-action="requestData"><span>{%: $.moreText %}</span></button>')}
                    ]}
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
            '<div data-action="selectEntry" class="list-item-selector"></div>',
            '{%! $$.itemTemplate %}',
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
        _selectionModel: null,
        _selectionConnects: null,
        _setSelectionModelAttr: function(selectionModel) {
            if (this._selectionConnects)
                array.forEach(this._selectionConnects, this.disconnect, this);

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

            domClass.toggle(this.domNode, 'has-search', this.hideSearch);

            if (this.searchText)
                this.$.search.setLabel(this.searchText);

            this.clear(true);
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
        isNavigationDisabled: function() {
            return ((this.options && this.options.selectionOnly) || (this.selectionOnly));
        },
        isSelectionDisabled: function() {
            return !((this.options && this.options.selectionOnly) || (this.allowSelection));
        },
        _onSelectionModelSelect: function(key, data, tag) {
            var node = dom.byId(tag) || query('li[data-key="'+key+'"]', this.domNode)[0];
            if (node)
                domClass.add(node, 'list-item-selected');
        },
        _onSelectionModelDeselect: function(key, data, tag) {
            var node = dom.byId(tag) || query('li[data-key="'+key+'"]', this.domNode)[0];
            if (node)
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
                        this.selectEntry({$source: row});
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

            if (this.options.singleSelect && this.options.singleSelectAction)
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
                        this.invokeSingleSelectAction();
                }
                else
                {
                    this.navigateToDetailView(key, descriptor);
                }
            }
        },
        invokeSingleSelectAction: function() {
            if (App.bars['tbar'])
                App.bars['tbar'].invokeTool({tool: this.options.singleSelectAction});

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
            this.requestData();
        },
        _onSearchClear: function() {

        },
        createStore: function() {
            return null;
        },
        navigateToDetailView: function(key, descriptor) {
            scene().showView(this.detailView, {
                descriptor: descriptor,
                key: key
            });
        },
        navigateToInsertView: function() {
            scene().showView(this.detailView, {
                returnTo: this.id,
                insert: true
            });
        },
        onContentChange: function() {
        },
        _onFetchBegin: function(size, request) {
            if (size === 0)
            {
                domConstruct.place(this.noDataTemplate.apply(this), this.contentNode, 'only');
            }
            else
            {
                var remaining = size > -1
                    ? size - (request['start'] + request['count'])
                    : -1;

                if (remaining !== -1)
                    this.set('remainingContent', string.substitute(this.remainingText, [remaining]));

                domClass.toggle(this.domNode, 'has-more', (remaining === -1 || remaining > 0));

                this.position = this.position + request['count'];
            }

            /* todo: move to a more appropriate location */
            if (this.options && this.options.allowEmptySelection) domClass.add(this.domNode, 'has-empty');
        },
        processItem: function(item) {
            return item;
        },
        _onFetchComplete: function(items, request) {
            var store = this.get('store'),
                count = items.length;
            if (count > 0)
            {
                var output = [];

                for (var i = 0; i < count; i++)
                {
                    var item = this.processItem(items[i]);

                    this.items[store.getIdentity(item)] = item;

                    output.push(this.rowTemplate.apply(item, this));
                }

                if (output.length > 0) domConstruct.place(output.join(''), this.contentNode, 'last');
            }

            domClass.remove(this.domNode, 'is-loading');

            /* remove the loading indicator so that it does not get re-shown while requesting more data */
            if (request['start'] === 0) domConstruct.destroy(this.loadingIndicatorNode);

            this.onContentChange();
        },
        _onFetchError: function(error, keywordArgs) {
            alert(string.substitute(this.requestErrorText, [error]));

            ErrorManager.addError(error.xhr, keywordArgs, this.options, 'failure');

            domClass.remove(this.domNode, 'is-loading');
        },
        _onFetchAbort: function(error, keywordArgs) {
            this.options = false; // force a refresh

            ErrorManager.addError(error.xhr, keywordArgs, this.options, 'aborted');

            domClass.remove(this.domNode, 'is-loading');
        },
        requestData: function() {
            domClass.add(this.domNode, 'is-loading');

            var store = this.get('store'),
                keywordArgs = {
                    scope: this,
                    onBegin: this._onFetchBegin,
                    onError: this._onFetchError,
                    onAbort: this._onFetchAbort,
                    onComplete: this._onFetchComplete,
                    count: this.pageSize,
                    start: this.position
                };

            this.applyQueryToFetch(keywordArgs);
            this.applyOptionsToFetch(keywordArgs);

            return store.fetch(keywordArgs);
        },
        applyQueryToFetch: function(keywordArgs) {
            if (this.query) keywordArgs.query = this.query;
        },
        applyOptionsToFetch: function(keywordArgs) {

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

            domClass.toggle(this.domNode, 'has-search', this.hideSearch);
            domClass.toggle(this.domNode, 'has-selectors', !this.isSelectionDisabled());

            if (this._selectionModel && !this.isSelectionDisabled())
                this._selectionModel.useSingleSelection(this.options.singleSelect);

            if (this.refreshRequired)
            {
                this.clear();
            }
            else
            {
                // if enabled, clear any pre-existing selections
                if (this._selectionModel && this.autoClearSelection)
                    this._selectionModel.clear();
            }
        },
        transitionTo: function() {
            if (this._selectionModel) this._loadPreviousSelections();

            this.inherited(arguments);
        },
        refresh: function() {
            this.requestData();
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
        }
    });

    return List;
});
