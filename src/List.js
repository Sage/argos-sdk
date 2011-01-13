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

Ext.namespace('Sage.Platform.Mobile');

(function() {
    Sage.Platform.Mobile.SelectionModel = Ext.extend(Ext.util.Observable, {
        count: 0,
        selections: null,
        clearAsDeselect: true,
        constructor: function(o) {
            Ext.apply(this, o, {
                selections: {}
            });

            this.addEvents(
                'select',
                'deselect',
                'clear'
            );
        },
        select: function(key, data, tag) {
            if (!this.selections.hasOwnProperty(key))
            {
                this.selections[key] = {data: data, tag: tag};
                this.count++;

                this.fireEvent('select', key, data, tag, this);
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

                this.fireEvent('deselect', key, selection.data, selection.tag, this);
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

            this.fireEvent('clear', this);
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

    Sage.Platform.Mobile.ConfigurableSelectionModel = Ext.extend(Sage.Platform.Mobile.SelectionModel, {
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

            Sage.Platform.Mobile.ConfigurableSelectionModel.superclass.select.apply(this, arguments);
        }
    });

    Sage.Platform.Mobile.List = Ext.extend(Sage.Platform.Mobile.View, {
        attachmentPoints: {
            contentEl: '.list-content',
            searchEl: '.list-search',
            searchQueryEl: '.list-search input',
            searchLabelEl: '.list-search label',
            moreEl: '.list-more',
            remainingEl: '.list-more .list-remaining span'
        },
        viewTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%= $.titleText %}" class="list {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
            '{%! $.searchTemplate %}',
            '<a href="#" class="android-6059-fix">fix for android issue #6059</a>',                
            '<ul class="list-content"></ul>',
            '{%! $.moreTemplate %}',
            '</div>'
        ]),
        loadingTemplate: new Simplate([
            '<li class="list-loading-indicator"><div>{%= $.loadingText %}</div></li>'
        ]),
        moreTemplate: new Simplate([
            '<div class="list-more">',
            '<div class="list-remaining"><span></span></div>',
            '<button class="button" data-action="more">',
            '<span>{%= $.moreText %}</span>',
            '</button>',
            '</div>'
        ]),
        searchTemplate: new Simplate([
            '<div class="list-search">',
            '<input type="text" name="query" class="query" />',
            '<button class="subHeaderButton dismissButton" data-action="clearSearchQuery">X</button>',
            '<button class="subHeaderButton searchButton" data-action="search">Search</button>',
            '<label>{%= $.searchText %}</label>',
            '</div>'
        ]),
        itemTemplate: new Simplate([
            '<li data-action="activateEntry" data-key="{%= $.$key %}" data-descriptor="{%: $.$descriptor %}">',
            '<div data-action="selectEntry" class="list-item-selector"></div>',
            '{%! $$.contentTemplate %}',
            '</li>'
        ]),
        contentTemplate: new Simplate([
            '<h3>{%: $.$descriptor %}</h3>',
            '<h4>{%: $.$key %}</h4>'
        ]),
        noDataTemplate: new Simplate([
            '<li class="no-data">',
            '<h3>{%= $.noDataText %}</h3>',
            '</li>'
        ]),
        id: 'generic_list',
        resourceKind: '',
        querySelect: null,
        queryInclude: null,
        queryOrderBy: null,
        resourceProperty: null,
        pageSize: 20,
        hideSearch: false,
        allowSelection: false,
        autoClearSelection: true,
        detailView: false,
        editView: false,
        insertView: false,
        contextView: false,
        hashTagQueries: null,
        customSearchRE: /^#!/,
        hashTagSearchRE: /^(?:#|;|,|\.)(\w+)/,
        moreText: 'Retrieve More Records',
        titleText: 'List',
        remainingText: '{0} records remaining',
        searchText: 'Search',
        cancelText: 'Cancel',
        insertText: 'New',
        noDataText: 'no records',
        loadingText: 'loading...',
        requestErrorText: 'A server error occured while requesting data.',
        init: function() {
            Sage.Platform.Mobile.List.superclass.init.call(this);

            if (!this.selectionModel)
                this.useSelectionModel(new Sage.Platform.Mobile.ConfigurableSelectionModel());

            this.tools.tbar = [{
                id: 'new',
                action: 'navigateToInsertView'
            }];

            this.clear();
        },
        initEvents: function() {
            Sage.Platform.Mobile.List.superclass.initEvents.call(this);

            App.on('refresh', this._onRefresh, this);

            this.searchQueryEl.on('keypress', this._onSearchKeyPress, this);
            this.searchQueryEl.on('focus', this._onSearchFocus, this);
            this.searchQueryEl.on('blur', this._onSearchBlur, this);
        },
        useSelectionModel: function(model) {
            if (this.selectionModel)
            {
                this.selectionModel.un('select', this._onSelectionModelSelect, this);
                this.selectionModel.un('deselect', this._onSelectionModelDeselect, this);
                this.selectionModel.un('clear', this._onSelectionModelClear, this);
            }

            this.selectionModel = model;
            this.selectionModel.on('select', this._onSelectionModelSelect, this);
            this.selectionModel.on('deselect', this._onSelectionModelDeselect, this);
            this.selectionModel.on('clear', this._onSelectionModelClear, this);
        },
        isNavigationDisabled: function() {
            return ((this.options && this.options.selectionOnly) || (this.selectionOnly));
        },
        isSelectionDisabled: function() {
            return !((this.options && this.options.selectionOnly) || (this.allowSelection));
        },        
        _onSearchBlur: function(evt, el, o) {
            if (this.searchQueryEl.dom.value == '')
                this.searchEl.removeClass('list-search-active');
        },
        _onSearchFocus: function(evt, el, o) {
            this.searchEl.addClass('list-search-active');
        },
        _onSearchKeyPress: function(evt, el, o) {
            if (evt.getKey() == 13 || evt.getKey() == 10)
            {
                evt.stopEvent();

                this.searchQueryEl.blur();

                this.search();
            }
        },
        _onLongPress: function(evt, el, o) {
            evt.stopEvent();

            var el = Ext.get(el),
                row = el.is('[data-key]') ? el : el.up('[data-key]');

            if (this.isNavigationDisabled()) return;

            var key = row && row.getAttribute('data-key'),
                descriptor = row && row.getAttribute('data-descriptor');

            this.navigateToContextView(key, descriptor, key && this.entries[key]);
        },
        _onSelectionModelSelect: function(key, data, tag) {
            var el = Ext.get(tag);
            if (el)
                el.addClass('list-item-selected');
        },
        _onSelectionModelDeselect: function(key, data, tag) {
            var el = Ext.get(tag);
            if (el)
                el.removeClass('list-item-selected');
        },
        _onSelectionModelClear: function() {
        },
        _onRefresh: function(o) {
            if (this.resourceKind && o.resourceKind === this.resourceKind)
            {
                this.refreshRequired = true;
            }
        },
        selectEntry: function(params) {
            var row = Ext.get(params.$source).up('[data-key]'),
                key = row ? row.getAttribute('data-key') : false;

            if (key) this.selectionModel.toggle(key, this.entries[key], row);
        },
        activateEntry: function(params) {
            if (params.key)
                if (this.isNavigationDisabled())
                    this.selectionModel.toggle(params.key, this.entries[params.key], params.$source);
                else
                    this.navigateToDetailView(params.key, params.descriptor);
        },
        clearSearchQuery: function() {
            this.searchEl.removeClass('list-search-active');
            this.searchQueryEl.dom.value = '';
        },
        search: function() {
            /// <summary>
            ///     Called when a new search is activated.  This method sets up the SData query, clears the content
            ///     of the view, and fires a request for updated data.
            /// </summary>
            /// <param name="searchText" type="String">The search query.</param>
            var search = this.searchQueryEl.dom.value.length > 0 ? this.searchQueryEl.dom.value : false,
                customMatch = search && this.customSearchRE.exec(search),
                hashTagMatch = search && this.hashTagSearchRE.exec(search);

            this.clear();

            this.queryText = search;
            this.query = false;

            if (customMatch)
            {
                this.query = search.replace(this.customSearchRE, '');
            }
            else if (hashTagMatch && this.hashTagQueries && this.hashTagQueries[hashTagMatch[1]])
            {
                this.query = this.expandExpression(this.hashTagQueries[hashTagMatch[1]], hashTagMatch);
            }
            else if (search)
            {
                this.query = this.formatSearchQuery(search);
            }

            this.requestData();
        },
        formatSearchQuery: function(query) {
            /// <summary>
            ///     Called to transform a textual query into an SData query compatible search expression.
            /// </summary>
            /// <returns type="String">An SData query compatible search expression.</returns>
            return false;
        },
        formatRelatedQuery: function(entry, fmt, property) {
            var property = property || '$key';

            return String.format(fmt, Sage.Platform.Mobile.Utility.getValue(entry, property));
        },
        createRequest:function() {
            /// <summary>
            ///     Creates SDataResourceCollectionRequest instance and sets a number of known properties.
            /// </summary>
            /// <returns type="Sage.SData.Client.SDataResourceCollectionRequest">An SDataResourceCollectionRequest instance.<returns>
            var pageSize = this.pageSize;
            var startIndex = this.feed && this.feed['$startIndex'] > 0 && this.feed['$itemsPerPage'] > 0
                ? this.feed['$startIndex'] + this.feed['$itemsPerPage']
                : 1;

            var request = new Sage.SData.Client.SDataResourceCollectionRequest(this.getService())
                .setCount(pageSize)
                .setStartIndex(startIndex);

            if (this.resourceKind)
                request.setResourceKind(this.resourceKind);

            if (this.resourceProperty)
                request
                    .getUri()
                    .setPathSegment(Sage.SData.Client.SDataUri.ResourcePropertyIndex, this.resourceProperty);

            if (this.querySelect)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Select, this.querySelect.join(','));

            if (this.queryInclude)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Include, this.queryInclude.join(','));

            if (this.queryOrderBy)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.OrderBy, this.queryOrderBy);

            var where = [];

            if (this.options)
            {
                var resourceKindExpr = this.expandExpression(this.options.resourceKind);
                if (resourceKindExpr)
                    request.setResourceKind(resourceKindExpr);

                var resourcePropertyExpr = this.expandExpression(this.options.resourceProperty);
                if (resourcePropertyExpr)
                    request
                        .getUri()
                        .setPathSegment(Sage.SData.Client.SDataUri.ResourcePropertyIndex, resourcePropertyExpr);

                var resourcePredicateExpr = this.expandExpression(this.options.resourcePredicate);
                if (resourcePredicateExpr)
                    request
                        .getUri()
                        .setCollectionPredicate(resourcePredicateExpr);

                var whereExpr = this.expandExpression(this.options.where);
                if (whereExpr)
                    where.push(whereExpr);

                var orderByExpr = this.expandExpression(this.options.orderBy);
                if (orderByExpr)
                    request.setQueryArgs({
                        'orderby': orderByExpr
                    });
            }

            if (this.query)
                where.push(this.query);

            if (where.length > 0)
                request.setQueryArgs({
                    'where': where.join(' and ')
                });

            return request;
        },
        showContextViewFor: function(key, descriptor, entry)
        {
            return true;
        },
        navigateToContextView: function(key, descriptor, entry) {
            /// <summary>
            ///     Shows the requested context dialog.
            /// </summary>
            var view = App.getView(this.contextView);
            if (view && this.showContextViewFor(key, descriptor, entry))
                view.show({
                    returnTo: this.id,
                    resourceKind: this.resourceKind,
                    descriptor: descriptor,
                    entry: entry,
                    key: key,
                    items: this.createContextMenu()
                });
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
        navigateToInsertView: function() {
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
            if (!this.feed) this.contentEl.update('');

            this.feed = feed;

            if (this.feed['$totalResults'] === 0)
            {
                Ext.DomHelper.append(this.contentEl, this.noDataTemplate.apply(this));
            }
            else if (feed['$resources'])
            {
                var o = [];

                for (var i = 0; i < feed['$resources'].length; i++)
                {
                    var entry = feed['$resources'][i];

                    this.entries[entry.$key] = entry;

                    o.push(this.itemTemplate.apply(entry, this));
                }

                if (o.length > 0)
                    Ext.DomHelper.append(this.contentEl, o.join(''));
            }

            if (this.remainingEl)
                this.remainingEl.update(String.format(
                    this.remainingText,
                    this.feed['$totalResults'] - (this.feed['$startIndex'] + this.feed['$itemsPerPage'] - 1)
                ));

            if (this.hasMoreData())
                this.el.addClass('list-has-more');
            else
                this.el.removeClass('list-has-more');
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
        requestFailure: function(response, o) {
            /// <summary>
            ///     Called when an error occurs while request data from the SData endpoint.
            /// </summary>
            /// <param name="response" type="Object">The response object.</param>
            /// <param name="o" type="Object">The options that were passed to Ext when creating the Ajax request.</param>
            alert(String.format(this.requestErrorText, response, o));
        },
        requestData: function() {
            /// <summary>
            ///     Initiates the SData request.
            /// </summary>

            this.el.addClass('list-loading');

            var request = this.createRequest();
            request.read({
                success: function(feed) {
                    this.processFeed(feed);
                    this.el.removeClass('list-loading');
                },
                failure: function(response, o) {
                    this.requestFailure(response, o);
                    this.el.removeClass('list-loading');
                },
                aborted: function(response, o) {
                    this.options = false; // force a refresh
                    this.el.removeClass('list-loading');
                },
                scope: this
            });
        },
        more: function() {
            /// <summary>
            ///     Called when the more button is clicked.
            /// </summary>
            this.requestData();
        },
        expandExpression: function(expression) {
            /// <summary>
            ///     Expands the passed expression if it is a function.
            /// </summary>
            /// <param name="expression" type="String">
            ///     1: function - Called on this object and must return a string.
            ///     2: string - Returned directly.
            /// </param>
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
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
                return Sage.Platform.Mobile.List.superclass.refreshRequiredFor.call(this, options);
        },
        getContext: function() {
            return Ext.apply(Sage.Platform.Mobile.List.superclass.getContext.call(this), {
                resourceKind: this.resourceKind
            });
        },
        beforeTransitionTo: function() {
            Sage.Platform.Mobile.List.superclass.beforeTransitionTo.call(this);

            if (this.hideSearch)
                this.el.addClass('list-hide-search');
            else
                this.el.removeClass('list-hide-search');

            if (this.searchQueryEl.dom.value == '')
                this.searchEl.removeClass('list-search-active');
            else
                this.searchEl.addClass('list-search-active');

            if (this.isSelectionDisabled())
            {
                this.el.removeClass('list-show-selectors');
            }
            else
            {
                this.el.addClass('list-show-selectors');                

                this.selectionModel.useSingleSelection(this.options.singleSelect);
            }

            if (this.refreshRequired)
            {
                this.clear();
            }
            else
            {
                // if enabled, clear any pre-existing selections
                if (this.autoClearSelection) this.selectionModel.clear();
            }
        },
        refresh: function() {
            this.requestData();
        },
        show: function(options) {            
            Sage.Platform.Mobile.List.superclass.show.apply(this, arguments);
        },
        createContextMenu: function() {
            return this.contextMenu || [];
        },
        clear: function() {
            /// <summary>
            ///     Clears the view and re-applies the default content template.
            /// </summary>
            this.selectionModel.suspendEvents();
            this.selectionModel.clear();
            this.selectionModel.resumeEvents();

            this.requestedFirstPage = false;
            this.entries = {};
            this.feed = false;
            this.query = false;
            this.queryText = false;

            this.el.removeClass('list-has-more');

            this.contentEl.update(this.loadingTemplate.apply(this));
        }
    });
})();