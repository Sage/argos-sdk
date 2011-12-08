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

define('Sage/Platform/Mobile/List', ['Sage/Platform/Mobile/View', 'Sage/Platform/Mobile/SearchWidget'], function() {

    dojo.declare('Sage.Platform.Mobile.SelectionModel', null, {
        count: 0,
        selections: null,
        clearAsDeselect: true,
        _fireEvents: true,
        constructor: function(options) {
            this.selections = {};
            
            dojo.mixin(this, options);
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

                if (this._fireEvents) this.onDeselect(key, selection.data, selection.tag, this);
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

    dojo.declare('Sage.Platform.Mobile.ConfigurableSelectionModel', [Sage.Platform.Mobile.SelectionModel], {
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

    /**
     * A base list view.
     * @constructor
     * @extends Sage.Platform.Mobile.View
     * @param {Object} options The options for the view
     */
    return dojo.declare('Sage.Platform.Mobile.List', [Sage.Platform.Mobile.View], {
        attributeMap: {
            listContent: {node: 'contentNode', type: 'innerHTML'},
            remainingContent: {node: 'remainingContentNode', type: 'innerHTML'}
        },
        /**
         * The template used to render the view's main DOM element when the view is initialized.
         * This template includes {@link #searchTemplate} and {@link #moreTemplate}.
         */
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%= $.titleText %}" class="list {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
            '<div data-dojo-attach-point="searchNode"></div>',
            '<a href="#" class="android-6059-fix">fix for android issue #6059</a>',                
            '{%! $.emptySelectionTemplate %}',
            '<ul class="list-content" data-dojo-attach-point="contentNode"></ul>',
            '{%! $.moreTemplate %}',
            '</div>'
        ]),
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
            '<li class="list-loading-indicator"><div>{%= $.loadingText %}</div></li>'
        ]),
        /**
         * The template used to render the pager at the bottom of the view.  This template is not directly rendered, but is
         * included in {@link #viewTemplate}.
         *
         * The default template uses the following properties:
         *
         *      name                description
         *      ----------------------------------------------------------------
         *      moreText            The text to display on the more button.
         *
         * The default template exposes the following actions:
         *
         * * more
         */
        moreTemplate: new Simplate([
            '<div class="list-more" data-dojo-attach-point="moreNode">',
            '<div class="list-remaining"><span data-dojo-attach-point="remainingContentNode"></span></div>',
            '<button class="button" data-action="more">',
            '<span>{%= $.moreText %}</span>',
            '</button>',
            '</div>'
        ]),
        /**
         * Template used on lookups to have empty Selection option.
         * This template is not directly rendered but included in {@link #viewTemplate}.
         *
         * The default template uses the following properties:
         *
         *      name                description
         *      ----------------------------------------------------------------
         *      emptySelectionText  The text to display on the empty Selection button.
         *
         * The default template exposes the following actions:
         *
         * * emptySelection
         */
        emptySelectionTemplate: new Simplate([
            '<div class="list-empty-opt" data-dojo-attach-point="emptySelectionNode">',
            '<button class="button" data-action="emptySelection">',
            '<span>{%= $.emptySelectionText %}</span>',
            '</button>',
            '</div>'
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
        contentNode:null,
        remainingContentNode: null,
        searchNode: null,
        emptySelectionNode: null,
        remainingNode: null,
        moreNode: null,
        /**
         * @cfg {String} id
         * The id for the view, and it's main DOM element.
         */
        id: 'generic_list',
        /**
         * @cfg {String} resourceKind
         * The SData resource kind the view is responsible for.  This will be used as the default resource kind
         * for all SData requests.
         * @type {String}
         */
        resourceKind: '',
        /**
         * A list of fields to be selected in an SData request.
         * @type {Array.<String>}
         */
        querySelect: null,
        /**
         * A list of child properties to be included in an SData request.
         * @type {Array.<String>}
         */
        queryInclude: null,
        /**
         * The default order by expression for an SData request.
         * @type {String}
         */
        queryOrderBy: null,
        /**
         * The default where expression for an SData request.
         * @type {String|Function}
         */
        queryWhere: null,
        /**
         * The default resource property for an SData request.
         * @type {String|Function}
         */
        resourceProperty: null,
        /**
         * The default resource predicate for an SData request.
         * @type {String|Function}
         */
        resourcePredicate: null,
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
         * A dictionary of hash tag search queries.  The key is the hash tag, without the symbol, and the value is
         * either a query string, or a function that returns a query string.
         * @type {?Object}
         */
        hashTagQueries: null,
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
        loadingText: 'loading...',
        /**
         * The text displayed when a data request fails.
         * @type {String}
         */
        requestErrorText: 'A server error occurred while requesting data.',
        customizationSet: 'list',                
        searchWidget: null,
        searchWidgetClass: Sage.Platform.Mobile.SearchWidget,
        _selectionModel: null,
        _selectionConnects: null,
        _setSelectionModelAttr: function(selectionModel) {
            if (this._selectionConnects)
                dojo.forEach(this._selectionConnects, this.disconnect, this);

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
        postCreate: function() {
            this.inherited(arguments);

            if (this._selectionModel == null) this.set('selectionModel', new Sage.Platform.Mobile.ConfigurableSelectionModel());

            this.connect(App, 'onRefresh', this._onRefresh);

            if (this.enableSearch)
            {
                var searchWidgetCtor = dojo.isString(this.searchWidgetClass)
                    ? dojo.getObject(this.searchWidgetClass, false)
                    : this.searchWidgetClass;

                this.searchWidget = this.searchWidget || new searchWidgetCtor({
                    'class': 'list-search',
                    'owner': this,
                    'onSearchExpression': dojo.hitch(this, this._onSearchExpression)
                });
                this.searchWidget.placeAt(this.searchNode, 'replace');
            }
            else
            {
                this.searchWidget = null;
            }

            dojo.toggleClass(this.domNode, 'list-hide-search', this.hideSearch);

            this.clear();
        },
        startup: function() {
            this.inherited(arguments);

            if (this.searchWidget)
                this.searchWidget.configure({
                    'hashTagQueries': this._createCustomizedLayout(this.createHashTagQueryLayout(), 'hashTagQueries'),
                    'formatSearchQuery': dojo.hitch(this, this.formatSearchQuery)
                });
        },
        destroy: function() {
			if (this.searchWidget)
            {
				if(!this.searchWidget._destroyed) this.searchWidget.destroyRecursive();

				delete this.searchWidget;
			}
            
			this.inherited(arguments);
		},
        createToolLayout: function() {
            return this.tools || (this.tools = {
                'tbar': [{
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
            var el = dojo.byId(tag) || dojo.query('li[data-key="'+key+'"]', this.domNode)[0];
            if (el) dojo.addClass(el, 'list-item-selected');
        },
        _onSelectionModelDeselect: function(key, data, tag) {
            var el = dojo.byId(tag) || dojo.query('li[data-key="'+key+'"]', this.domNode)[0];
            if (el) dojo.removeClass(el, 'list-item-selected');
        },
        _onSelectionModelClear: function() {
        },
        _loadPreviousSelections: function(){
            var selections = this.options && this.options.previousSelections;
            if (selections)
            {
                for(var i = 0; i < selections.length; i++)
                {
                    var data = selections[i],
                        key = data;
                    this._selectionModel.select(key, data);
                }
            }
        },
        _onRefresh: function(options) {
            if (this.resourceKind && options.resourceKind === this.resourceKind)
            {
                this.refreshRequired = true;
            }
        },
        selectEntry: function(params) {
            var row = dojo.query(params.$source).closest('[data-key]')[0],
                key = row ? row.getAttribute('data-key') : false;

            if (this._selectionModel && key)
                this._selectionModel.toggle(key, this.entries[key], row);
        },
        activateEntry: function(params) {
            if (params.key)
            {
                if (this._selectionModel && this.isNavigationDisabled())
                {
                    this._selectionModel.toggle(params.key, this.entries[params.key] || params.descriptor, params.$source);
                    if (this.options.singleSelect && this.options.singleSelectAction)
                    {
                        if (App.bars['tbar'])
                            App.bars['tbar'].invokeTool({tool: this.options.singleSelectAction});

                        if (this.autoClearSelection) { this._selectionModel.clear(); }
                    }
                }
                else
                {
                    this.navigateToDetailView(params.key, params.descriptor);
                }
            }
        },
        formatRelatedQuery: function(entry, fmt, property) {
            return dojo.string.substitute(fmt, [dojo.getObject(property || '$key', false, entry)]);
        },
        formatSearchQuery: function(query) {
            /// <summary>
            ///     Called to transform a textual query into an SData query compatible search expression.
            /// </summary>
            /// <returns type="String">An SData query compatible search expression.</returns>
            return false;
        },
        escapeSearchQuery: function(query) {
            return (query || '').replace(/"/g, '""');
        },
        _onSearchExpression: function(expression) {
            this.clear(false);

            this.queryText = '';
            this.query = expression;

            this.requestData();
        },
        configureSearch: function() {
            if (this.searchWidget)
                this.searchWidget.configure({
                    'context': this.getContext()
                });
        },
        createRequest:function() {
            /// <summary>
            ///     Creates SDataResourceCollectionRequest instance and sets a number of known properties.
            /// </summary>
            /// <returns type="Sage.SData.Client.SDataResourceCollectionRequest">An SDataResourceCollectionRequest instance.<returns>

            // todo: should we cache the request? the only thing that needs to change on subsequent requests is the paging.

            var where = [],
                options = this.options,
                pageSize = this.pageSize,
                startIndex = this.feed && this.feed['$startIndex'] > 0 && this.feed['$itemsPerPage'] > 0
                    ? this.feed['$startIndex'] + this.feed['$itemsPerPage']
                    : 1;

            var request = new Sage.SData.Client.SDataResourceCollectionRequest(this.getService())
                .setCount(pageSize)
                .setStartIndex(startIndex);

            var resourceKindExpr = this.expandExpression((options && options.resourceKind) || this.resourceKind);
            if (resourceKindExpr)
                request.setResourceKind(this.resourceKind);

            var resourcePropertyExpr = this.expandExpression((options && options.resourceProperty) || this.resourceProperty);
            if (resourcePropertyExpr)
                request
                    .getUri()
                    .setPathSegment(Sage.SData.Client.SDataUri.ResourcePropertyIndex, resourcePropertyExpr);

            var resourcePredicateExpr = this.expandExpression((options && options.resourcePredicate) || this.resourcePredicate);
            if (resourcePredicateExpr)
                request
                    .getUri()
                    .setCollectionPredicate(resourcePredicateExpr);

            var querySelectExpr = this.expandExpression(this.querySelect);
            if (querySelectExpr)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Select, querySelectExpr.join(','));

            var queryIncludeExpr = this.expandExpression(this.queryInclude);
            if (queryIncludeExpr)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Include, queryIncludeExpr.join(','));

            var queryOrderByExpr = this.expandExpression((options && options.orderBy) || this.queryOrderBy);
            if (queryOrderByExpr)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.OrderBy, queryOrderByExpr);

            var queryWhereExpr = this.expandExpression((options && options.where) || this.queryWhere);
            if (queryWhereExpr)
                where.push(queryWhereExpr);

            if (this.query)
                where.push(this.query);

            if (where.length > 0)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Where, where.join(' and '));

            return request;
        },                
        navigateToDetailView: function(key, descriptor) {
            /// <summary>
            ///     Navigates to the requested detail view.
            /// </summary>
            /// <param name="el" type="Ext.Element">The element that initiated the navigation.</param>
            var view = App.getView(this.detailView);
            if (view)
                view.show({
                    descriptor: descriptor,
                    key: key
                });
        },
        navigateToInsertView: function(el) {
            var view = App.getView(this.insertView || this.editView);
            if (view)
            {
                view.show({
                    returnTo: this.id,
                    insert: true
                });
            }
        },
        processFeed: function(feed) {
            /// <summary>
            ///     Processes the feed result from the SData request and renders out the resource feed entries.
            /// </summary>
            /// <param name="feed" type="Object">The feed object.</param>
            if (!this.feed) this.set('listContent', '');

            this.feed = feed;
            if (this.feed['$totalResults'] === 0)
            {
                this.set('listContent', this.noDataTemplate.apply(this));                
            }
            else if (feed['$resources'])
            {
                var o = [];

                for (var i = 0; i < feed['$resources'].length; i++)
                {
                    var entry = feed['$resources'][i];

                    entry['$descriptor'] = entry['$descriptor'] || feed['$descriptor'];

                    this.entries[entry.$key] = entry;

                    o.push(this.rowTemplate.apply(entry, this));
                }

                if (o.length > 0) dojo.query(this.contentNode).append(o.join('')); // this.set('listContent', o.join(''));
            }

            // todo: add more robust handling when $totalResults does not exist, i.e., hide element completely
            if (typeof this.feed['$totalResults'] !== 'undefined')
            {
                var remaining = this.feed['$totalResults'] - (this.feed['$startIndex'] + this.feed['$itemsPerPage'] - 1);
                this.set('remainingContent', dojo.string.substitute(this.remainingText, [remaining]));
            }

            dojo.toggleClass(this.domNode, 'list-has-more', this.hasMoreData());

            if (this.options.allowEmptySelection) dojo.addClass(this.domNode, 'list-has-empty-opt');

        },
        hasMoreData: function() {
            /// <summary>
            ///     Deterimines if there is more data to be shown by inspecting the last feed result.
            /// </summary>
            /// <returns type="Boolean">True if the feed has more data; False otherwise.</returns>
            if (this.feed['$startIndex'] > 0 && this.feed['$itemsPerPage'] > 0 && this.feed['$totalResults'] >= 0)
            {
                var start = this.feed['$startIndex'];
                var count = this.feed['$itemsPerPage'];
                var total = this.feed['$totalResults'];

                return (start + count <= total);
            }
            else
            {
                return true; // no way to determine, always assume more data
            }
        },
        onRequestDataFailure: function(response, o) {
            /// <summary>
            ///     Called when an error occurs while request data from the SData endpoint.
            /// </summary>
            /// <param name="response" type="Object">The response object.</param>
            /// <param name="o" type="Object">The options that were passed to Ext when creating the Ajax request.</param>
            alert(dojo.string.substitute(this.requestErrorText, [response, o]));
            Sage.Platform.Mobile.ErrorManager.addError(response, o, this.options, 'failure');
            dojo.removeClass(this.domNode, 'list-loading');
        },
        onRequestDataAborted: function(response, o) {
            this.options = false; // force a refresh
            Sage.Platform.Mobile.ErrorManager.addError(response, o, this.options, 'aborted');

            dojo.removeClass(this.domNode, 'list-loading'); 
        },
        onRequestDataSuccess: function(feed) {
            this.processFeed(feed);

            dojo.removeClass(this.domNode, 'list-loading'); 
        },
        requestData: function() {
            /// <summary>
            ///     Initiates the SData request.
            /// </summary>

            dojo.addClass(this.domNode, 'list-loading');

            var request = this.createRequest();
            request.read({
                success: this.onRequestDataSuccess,
                failure: this.onRequestDataFailure,
                aborted: this.onRequestDataAborted,
                scope: this
            });
        },
        more: function() {
            /// <summary>
            ///     Called when the more button is clicked.
            /// </summary>
            this.requestData();
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
                    if (this.expandExpression(this.options.stateKey) != this.expandExpression(options.stateKey)) return true;
                    if (this.expandExpression(this.options.where) != this.expandExpression(options.where)) return true;
                    if (this.expandExpression(this.options.resourceKind) != this.expandExpression(options.resourceKind)) return true;
                    if (this.expandExpression(this.options.resourcePredicate) != this.expandExpression(options.resourcePredicate)) return true;
                }

                return false;
            }
            else
                return this.inherited(arguments);
        },
        getContext: function() {
            return dojo.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind
            });
        },
        beforeTransitionTo: function() {
            this.inherited(arguments);

            dojo.toggleClass(this.domNode, 'list-hide-search', this.hideSearch);
            dojo.toggleClass(this.domNode, 'list-show-selectors', !this.isSelectionDisabled());

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
        transitionTo: function()
        {
            this.configureSearch();

            if (this._selectionModel) this._loadPreviousSelections();
            
            this.inherited(arguments);
        },
        createHashTagQueryLayout: function() {
            // todo: always regenerate this layout? always regenerating allows for all existing customizations
            // to still work, at expense of potential (rare) performance issues if many customizations are registered.
            var layout = [];
            for (var name in this.hashTagQueries)
                layout.push({
                    key: name,
                    tag: (this.hashTagQueriesText && this.hashTagQueriesText[name]) || name,
                    query: this.hashTagQueries[name]
                });
            return layout;
        },
        refresh: function() {
            this.requestData();
        },
        clear: function(all) {
            /// <summary>
            ///     Clears the view and re-applies the default content template.
            /// </summary>

            if (this._selectionModel)
            {
                this._selectionModel.suspendEvents();
                this._selectionModel.clear();
                this._selectionModel.resumeEvents();
            }

            this.requestedFirstPage = false;
            this.entries = {};
            this.feed = false;
            this.query = false; // todo: rename to searchQuery

            if (all !== false && this.searchWidget) this.searchWidget.clear();

            dojo.removeClass(this.domNode, 'list-has-more');

            this.set('listContent', this.loadingTemplate.apply(this));
        }
    });
});