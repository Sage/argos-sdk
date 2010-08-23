/// <reference path="../ext/ext-core-debug.js"/>
/// <reference path="Application.js"/>
/// <reference path="View.js"/>

Ext.namespace('Sage.Platform.Mobile');

Sage.Platform.Mobile.SelectionModel = Ext.extend(Ext.util.Observable, {
    constructor: function(o) {
        Ext.apply(this, o, {
            selections: {},
            clearAsDeselect: true,
            count: 0
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
    constructor: function(o) {
        Ext.apply(this, {
            singleSelection: false
        });

        Sage.Platform.Mobile.ConfigurableSelectionModel.superclass.constructor.apply(this, arguments);
    },
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
    viewTemplate: new Simplate([
        '<ul id="{%= id %}" title="{%= title %}" class="list">',
        '</ul>'
    ]),    
    loadingTemplate: new Simplate([
        '<li class="loading"><div class="loading-indicator">{%= loadingText %}</div></li>',
        '<li class="search toolbar" style="display: none;">',
            '<form>',
                '<fieldset>',
                    '<input type="text" name="query" class="query" />',
                    '<a type="cancel" class="dismissButton">{%= $.cancelText %}</a>',
                    '<a class="searchButton" target="_none">{%= $.searchText %}</a>',
                    '<label>{%= $.searchText %}</label>',
                '</fieldset>',
            '</form>',
        '</li>',
        '<li class="more" style="display: none;"><a href="#" target="_none" class="whiteButton moreButton"><span>{%= moreText %}</span></a></li>'
    ]),
    itemTemplate: new Simplate([
        '<li>',
        '<div m:key="{%= $["$key"] %}" class="list-item-selector"></div>',
        '{%! this.contentTemplate %}',
        '</li>'
    ]),
    contentTemplate: new Simplate([
        '<h3>{%= $["$descriptor"] %}</h3>'
    ]),
    noDataTemplate: new Simplate([
        '<li class="no-data">',
        '<h3>{%= noDataText %}</h3>',
        '</li>'
    ]),
    moreText: 'Retrieve more records...',
    titleText: 'List',
    searchText: 'Search',
    cancelText: 'Cancel',
    insertText: 'New',
    noDataText: 'no records',
    loadingText: 'loading...',
    customSearchRE: /^\#\!/,
    constructor: function(o) {
        /// <field name="resourceKind" type="String">The resource kind that is bound to this view.</field>
        /// <field name="pageSize" type="Number">The number of records to return with each request.</field>
        /// <field name="requestedFirstPage" type="Boolean">True if the first page has been request; False otherwise.<field>
        /// <field name="noDataText" type="String">A message to display when there is no data.</field>
        /// <field name="contentTemplate" type="Simplate">A template used to render the initial content of the view.</field>
        /// <field name="itemTemplate" type="Simplate">
        ///     A template used to render each resource feed entry.  This template is rendered and then applied to the DOM
        ///     before the "li.more" element.
        /// </field>
        /// <field name="noDataTemplate" type="Simplate">A template used to render the no data message.</field>
        Sage.Platform.Mobile.List.superclass.constructor.call(this);

        Ext.apply(this, o, {
            id: 'generic_list',
            title: this.titleText,
            entries: {},
            pageSize: 20,
            requestedFirstPage: false,
            contextDialog: 'context_dialog',
            allowSelection: false,
            tools: {
                tbar: [{
                    name: 'New',
                    title: this.insertText,
                    fn: this.navigateToInsert,
                    cls: "button",
                    scope: this
                }]
            }
        });

        if (typeof this.selectionModel === 'undefined')
            this.selectionModel = new Sage.Platform.Mobile.ConfigurableSelectionModel();

        this.selectionModel.on('select', this.onSelectionModelSelect, this);
        this.selectionModel.on('deselect', this.onSelectionModelDeselect, this);
        this.selectionModel.on('clear', this.onSelectionModelClear, this);
    },
    render: function() {
        Sage.Platform.Mobile.List.superclass.render.call(this);

        this.clear();
    },
    init: function() {
        Sage.Platform.Mobile.List.superclass.init.call(this);

        this.el.on('click', this.onClick, this);
        this.el.on('clicklong', this.onClickLong, this);
        
        App.on('refresh', this.onRefresh, this);
    },
    isNavigationDisabled: function() {
        return (this.options && this.options.selectionOnly);
    },
    isSelectionDisabled: function() {
        return !((this.options && this.options.selectionOnly) || (this.allowSelection));
    },
    onClickLong: function(evt, el, o) {
        evt.stopEvent();

        if (this.isNavigationDisabled()) return;

        var resourceKind = this.resourceKind;
        if (!/^(accounts)|(contacts)|(opportunities)|(leads)|(tickets)$/.test(resourceKind)) {
            this.onClick(evt, el, o);
            return;
        }
        App.getView(this.contextDialog).show(el);
    },
    onSelectionModelSelect: function(key, data, tag) {
        var el = Ext.get(tag);
        if (el)
            el.addClass('list-item-selected');
    },
    onSelectionModelDeselect: function(key, data, tag) {
        var el = Ext.get(tag);
        if (el)
            el.removeClass('list-item-selected'); 
    },
    onSelectionModelClear: function() {
    },
    onClick: function(evt, el, o) {
        // todo: make these easily defined actions
        var el = Ext.get(el);
        if (el.is('.more') || el.up('.more'))
        {
            evt.stopEvent();

            this.more();
            return;
        }

        if (el.is('.dismissButton')) {
            evt.stopEvent();

            if (this.searchEl.dom.value != "") {
                this.searchEl.dom.value = "";
            }

            el.hide();
            return;
        }

        if (el.is('.searchButton')) {
            evt.stopEvent();
            
            this.search();
            return;
        }
        
        var link = el;
        if (link.is('a[target="_detail"]') || (link = link.up('a[target="_detail"]')))
        {
            evt.stopEvent();

            var view = link.dom.hash.substring(1);

            var key = link.getAttribute("key", "m");
            var descriptor = link.getAttribute("descriptor", "m");

            if (this.isNavigationDisabled())
                this.selectionModel.toggle(key, this.entries[key], link.up('li'));
            else
                this.navigateToDetail(view, key, descriptor);
            return;
        }
    },
    onRefresh: function(o) {
        if (this.resourceKind && o.resourceKind === this.resourceKind)
        {
            this.refreshRequired = true;
        }
    },
    search: function() {
        /// <summary>
        ///     Called when a new search is activated.  This method sets up the SData query, clears the content
        ///     of the view, and fires a request for updated data.
        /// </summary>
        /// <param name="searchText" type="String">The search query.</param>
        var search = this.searchEl.dom.value.length > 0 ? this.searchEl.dom.value : false;

        this.clear();

        this.queryText = search;
        this.query = this.customSearchRE.test(this.queryText)
            ? this.queryText.replace(this.customSearchRE, '')
            : this.formatSearchQuery(this.queryText);

        this.requestData();
    },
    formatSearchQuery: function(query) {
        /// <summary>
        ///     Called to transform a textual query into an SData query compatible search expression.
        /// </summary>
        /// <returns type="String">An SData query compatible search expression.</returns>
        return false;
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

        var where = [];

        if (this.context)
        {
            var resourceKindExpr = this.expandExpression(this.context.resourceKind);
            if (resourceKindExpr)
                request.setResourceKind(resourceKindExpr);

            var resourcePredicateExpr = this.expandExpression(this.context.resourcePredicate);
            if (resourcePredicateExpr)
                request
                    .getUri()
                    .setCollectionPredicate(resourcePredicateExpr);

            var whereExpr = this.expandExpression(this.context.where);
            if (whereExpr)
                where.push(whereExpr);
        }

        if (this.query)
            where.push(this.query);

        if (where.length > 0)
            request.setQueryArgs({
                'where': where.join(' and ')
            });

        return request;
    },
    navigateToDetail: function(view, key, descriptor) {
        /// <summary>
        ///     Navigates to the requested detail view.
        /// </summary>
        /// <param name="el" type="Ext.Element">The element that initiated the navigation.</param>
        var v = App.getView(view);
        if (v)
            v.show({
                descriptor: descriptor,
                key: key
            });
    },
    navigateToInsert: function() {
        var view = App.getView(this.editor);
        if (view)
            view.show({insert: true});
    },
    processFeed: function(feed) {
        /// <summary>
        ///     Processes the feed result from the SData request and renders out the resource feed entries.
        /// </summary>
        /// <param name="feed" type="Object">The feed object.</param>
        if (!this.feed)
        {
            this.el
                .down('.loading')
                .remove();

            this.el
                .down('.search')
                .show();

            this.setUpSearchBoxHandlers();
        }

        this.feed = feed;

        if (this.feed['$totalResults'] === 0)
        {
            Ext.DomHelper.insertBefore(this.moreEl, this.noDataTemplate.apply(this));
        }
        else
        {
            var o = [];
            
            for (var i = 0; i < feed.$resources.length; i++)
            {
                var entry = feed.$resources[i];

                this.entries[entry.$key] = entry;

                o.push(this.itemTemplate.apply(entry, this));
            }

            if (o.length > 0)
                Ext.DomHelper.insertBefore(this.moreEl, o.join(''));
        }
        
        this.moreEl
            .removeClass('more-loading');

        if (this.hasMoreData())
            this.moreEl.show();
        else
            this.moreEl.hide();
    },
    setUpSearchBoxHandlers: function() {
        this.searchEl.dom.value = this.queryText === false ? "" : this.queryText;

        this.setSearchLabelVisibility();

        this.el.select('input.query')
            .on('keypress', function(evt, el, o) {
                if (evt.getKey() == 13 || evt.getKey() == 10)
                {
                    evt.stopEvent();

                    /* fix to hide iphone keyboard when go is pressed */
                    if (/(iphone|ipad)/i.test(navigator.userAgent))
                        Ext.get('backButton').focus();
                    this.search();
                }
          }, this)
          .on('keyup', this.setSearchLabelVisibility, this);
    },
    setSearchLabelVisibility: function() {
        if (this.searchEl.dom.value == "")
        {
            this.el.select('.dismissButton').hide();
            this.el.select('label').show();
        }
        else
        {
            this.el.select('.dismissButton').show();
            this.el.select('label').hide();
        }
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
    },
    requestData: function() {
        /// <summary>
        ///     Initiates the SData request.
        /// </summary>
        var request = this.createRequest();
        request.read({
            success: function(feed) {
                this.processFeed(feed);
            },
            failure: function(response, o) {
                this.requestFailure(response, o);
            },
            scope: this
        });
    },
    more: function() {
        /// <summary>
        ///     Called when the more button is clicked.
        /// </summary>
        this.moreEl.addClass('more-loading');
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
            return expression.call(this);
        else
            return expression;
    },    
    refreshRequiredFor: function(options) {        
        if (this.options)
        {
            if (options)
            {
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

        if (this.isSelectionDisabled())
            this.el.removeClass('list-show-selectors');
        else
        {
            this.el.addClass('list-show-selectors');
            this.selectionModel.useSingleSelection(this.options.singleSelect);
        }

        if (this.refreshRequired) this.clear();
    },
    refresh: function() {
        this.requestData();
    },
    transitionTo: function() {
        Sage.Platform.Mobile.List.superclass.transitionTo.call(this);

    },
    show: function(options) {        
        Sage.Platform.Mobile.List.superclass.show.apply(this, arguments);        
        
        if (this.searchEl && this.searchEl.dom.value == "")
        {            
            this.el.select('.dismissButton').hide();
            this.el.select('label').show();
        }
        else
        {
            this.el.select('.dismissButton').show();
            this.el.select('label').hide();
        }
    },
    clear: function() {
        /// <summary>
        ///     Clears the view and re-applies the default content template.
        /// </summary>
        this.el.update(this.loadingTemplate.apply(this));

        this.moreEl = this.el.down('.more');
        this.searchEl = this.el.child('input.query');

        this.selectionModel.suspendEvents();
        this.selectionModel.clear();
        this.selectionModel.resumeEvents();

        this.requestedFirstPage = false;
        this.entries = {};
        this.feed = false;
        this.query = false;
        this.queryText = false;
    }
});
