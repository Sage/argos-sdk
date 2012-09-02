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
 * A List View is a view used to display a collection of items in an easy to skim list. The List View also has a
 * selection model built in for selecting rows from the list and may be used in a number of different manners.
 * @extends View
 * @alternateClassName List
 */
define('Sage/Platform/Mobile/List', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/query',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/dom',
    'dojo/string',
    'dojo/window',
    'Sage/Platform/Mobile/ErrorManager',
    'Sage/Platform/Mobile/View',
    'Sage/Platform/Mobile/SearchWidget'
], function(
    declare,
    lang,
    array,
    query,
    domAttr,
    domClass,
    domConstruct,
    domGeom,
    dom,
    string,
    win,
    ErrorManager,
    View,
    SearchWidget
) {

    /**
     * SelectionModel provides a simple in-memory store for data that fires events
     * when a item is selected (added) or deselected (removed)
     * @alternateClassName SelectionModel
     */
    var SelectionModel = declare('Sage.Platform.Mobile.SelectionModel', null, {
        /**
         * @property {Number}
         * Number of selections
         */
        count: 0,
        /**
         * @property {Object}
         * Collection of selections where the key is the selections key
         */
        selections: null,
        /**
         * @property {Boolean}
         * Flag that determines how to clear:
         *
         * True: Deselect is called on every item, firing onDeselect for each and firing onClear at the end
         *
         * False: Collection is immediately wiped and only onClear is fired
         *
         */
        clearAsDeselect: true,
        /**
         * @property {Boolean}
         * Flag that control the firing of action events: onSelect, onDeselect, onClear
         */
        _fireEvents: true,
        /**
         * Initializes the selections to be empty and mixes the passed object overriding any default properties.
         * @param {Object} options The object to be mixed in.
         */
        constructor: function(options) {
            this.selections = {};
            
            lang.mixin(this, options);
        },
        /**
         * Prevents the firing of action events: onSelect, onDeselect, onClear
         */
        suspendEvents: function() {
            this._fireEvents = false;
        },
        /**
         * Enables the firing of action events:  onSelect, onDeselect, onClear
         */
        resumeEvents: function() {
            this._fireEvents = true;
        },
        /**
         * Event that happens when an item is selected/added.
         * @param {String} key Unique identifier string
         * @param {Object} data The item stored
         * @param tag
         * @param self
         * @template
         */
        onSelect: function(key, data, tag, self) {
        },
        /**
         * Event that happens when an item is deselected/removed.
         * @param {String} key Unique identifier string
         * @param {Object} data The item removed
         * @param tag
         * @param self
         * @template
         */
        onDeselect: function(key, data, tag, self) {
        },
        /**
         * Event that happens when the store is cleared
         * @param self
         */
        onClear: function(self) {
        },
        /**
         * Adds an item to the `selections` if it is not already stored.
         * @param {String} key Unique identifier string
         * @param {Object} data The item being selected
         * @param tag
         */
        select: function(key, data, tag) {
            if (!this.selections.hasOwnProperty(key))
            {
                this.selections[key] = {data: data, tag: tag};
                this.count++;
                if (this._fireEvents) this.onSelect(key, data, tag, this);
            }
        },
        /**
         * Adds an item to the `selections` if it is not already stored, if it is
         * stored, then it deselects (removes) the item.
         * @param {String} key Unique identifier string
         * @param {Object} data The item being selected
         * @param tag
         */
        toggle: function(key, data, tag) {
            if (this.isSelected(key))
                this.deselect(key);
            else
                this.select(key, data, tag);
        },
        /**
         * Removes an item from the store
         * @param {String} key Unique identifier string that was given when the item was added
         */
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
        /**
         * Removes all items from the store
         */
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
        /**
         * Determines if the given key is in the selections collection.
         * @param {String} key Unique identifier string that was given when the item was added
         * @return {Boolean} True if the item is in the store.
         */
        isSelected: function(key) {
            return !!this.selections[key];
        },
        /**
         * Returns the number of items in the store
         * @return {Number} Current count of items
         */
        getSelectionCount: function() {
            return this.count;
        },
        /**
         * Returns all items in the store
         * @return {Object} The entire selection collection
         */
        getSelections: function() {
            return this.selections;
        },
        /**
         * Returns a list of unique identifier keys used in the selection collection
         * @return {String[]} All keys in the store
         */
        getSelectedKeys: function() {
            var keys = [];
            for (var key in this.selections)
                if (this.selections.hasOwnProperty(key))
                    keys.push(key);
            return keys;
        }
    });

    /**
     * The ConfigurableSelectionModel adds the logic to the SelectionModel to only have one item selected at a time via the `singleSelection` flag.
     * @alternateClassName ConfigurableSelectionModel
     * @extends SelectionModel
     */
    var ConfigurableSelectionModel = declare('Sage.Platform.Mobile.ConfigurableSelectionModel', [SelectionModel], {
        /**
         * @property {Boolean}
         * Flag that controls if only one item is selectable at a time. Meaning if this is true
         * then when a selection is made it first {@link SelectionModel#clear clears} the store.
         */
        singleSelection: false,
        /**
         * This function is called in Lists {@link List#beforeTransitionTo beforeTransitionTo} and
         * it is always passed the Lists navigation options `singleSelect`.
         *
         * It then sets the flag `singleSelection` to the value if the passed value.
         *
         * @param {Boolean} val The state that `singleSelection` should be in.
         */
        useSingleSelection: function(val) {
            if (this.singleSelection != !!val) //false != undefined = true, false != !!undefined = false
            {
                this.singleSelection = val;
            }
        },
        /**
         * Extends the base {@link SelectionModel#select select} by first clearing out the entire
         * store if `singleSelection` is true and there are items already in the store.
         * @param {String} key Unique identifier string
         * @param {Object} data The item being selected
         * @param tag
         */
        select: function(key, data, tag) {
            if (this.singleSelection)
            {
                if (!this.isSelected(key) || (this.count >= 1)) this.clear();
            }

            this.inherited(arguments);
        }
    });

    return declare('Sage.Platform.Mobile.List', [View], {
        /**
         * @property {Object}
         * Creates a setter map to html nodes, namely:
         *
         * * listContent => contentNode's innerHTML
         * * remainingContent => remainingContentNode's innerHTML
         *
         */
        attributeMap: {
            listContent: {node: 'contentNode', type: 'innerHTML'},
            remainingContent: {node: 'remainingContentNode', type: 'innerHTML'}
        },
        /**
         * @property {Simplate}
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
            '{%! $.listActionTemplate %}',
            '</div>'
        ]),
        /**
         * @property {Simplate}
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
         * @property {Simplate}
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
         * @property {Simplate}
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
         * @property {Simplate}
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
         * @cfg {Simplate}
         * The template used to render the content of a row.  This template is not directly rendered, but is
         * included in {@link #rowTemplate}.
         *
         * This property should be overridden in the derived class.
         * @template
         */
        itemTemplate: new Simplate([
            '<h3>{%: $.$descriptor %}</h3>',
            '<h4>{%: $.$key %}</h4>'
        ]),
        /**
         * @property {Simplate}
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
         * @property {Simplate}
         * The template used to render the single list action row.
         */
        listActionTemplate: new Simplate([
            '<li data-dojo-attach-point="actionsNode" class="actions-row"></li>'
        ]),
        /**
         * @property {Simplate}
         * The template used to render a list action item.
         * The default template uses the following properties:
         *
         *      name                description
         *      ----------------------------------------------------------------
         *      actionIndex         The correlating index number of the action collection
         *      title               Text used for ARIA-labeling
         *      icon                Relative path to the icon to use
         *      id                  Unique name of action, also used for alt image text
         *      label               Text added below the icon
         */
        listActionItemTemplate: new Simplate([
            '<button data-action="invokeActionItem" data-id="{%= $.actionIndex %}" aria-label="{%: $.title || $.id %}">',
                '<img src="{%= $.icon %}" alt="{%= $.id %}" />',
                '<label>{%: $.label %}</label>',
            '</button>'
        ]),

        /**
         * @property {HTMLElement}
         * Attach point for the main view content
         */
        contentNode: null,
        /**
         * @property {HTMLElement}
         * Attach point for the remaining items content
         */
        remainingContentNode: null,
        /**
         * @property {HTMLElement}
         * Attach point for the search widget
         */
        searchNode: null,
        /**
         * @property {HTMLElement}
         * Attach point for the empty, or no selection, container
         */
        emptySelectionNode: null,
        /**
         * @property {HTMLElement}
         * Attach point for the remaining items container
         */
        remainingNode: null,
        /**
         * @property {HTMLElement}
         * Attach point for the request more items container
         */
        moreNode: null,
        /**
         * @property {HTMLElement}
         * Attach point for the list actions container
         */
        actionsNode: null,

        /**
         * @cfg {String} id
         * The id for the view, and it's main DOM element.
         */
        id: 'generic_list',
        /**
         * @cfg {String}
         * The SData resource kind the view is responsible for.  This will be used as the default resource kind
         * for all SData requests.
         */
        resourceKind: '',
        /**
         * @property {String[]}
         * A list of fields to be selected in an SData request.
         */
        querySelect: null,
        /**
         * @property {String[]}
         * A list of child properties to be included in an SData request.
         */
        queryInclude: null,
        /**
         * @property {String}
         * The default order by expression for an SData request.
         */
        queryOrderBy: null,
        /**
         * @property {String/Function}
         * The default where expression for an SData request.
         */
        queryWhere: null,
        /**
         * @property {String/Function}
         * The default resource property for an SData request.
         */
        resourceProperty: null,
        /**
         * @property {String/Function}
         * The default resource predicate for an SData request.
         */
        resourcePredicate: null,
        /**
         * @property {Number}
         * The number of items to request per SData payload.
         */
        pageSize: 20,
        /**
         * @property {Boolean}
         * Controls the addition of a search widget.
         */
        enableSearch: true,
        /**
         * @property {Boolean}
         * Flag that determines if the list actions panel should be in use.
         */
        enableActions: false,
        /**
         * @property {Boolean}
         * Controls the visibility of the search widget.
         */
        hideSearch: false,
        /**
         * @property {Boolean}
         * True to allow selections via the SelectionModel in the view.
         */
        allowSelection: false,
        /**
         * @property {Boolean}
         * True to clear the selection model when the view is shown.
         */
        autoClearSelection: true,
        /**
         * @property {String/View}
         * The id of the detail view, or view instance, to show when a row is clicked.
         */
        detailView: null,
        /**
         * @property {String}
         * The view id to show if there is no `insertView` specified, when
         * the {@link #navigateToInsertView} action is invoked.
         */
        editView: null,
        /**
         * @property {String}
         * The view id to show when the {@link #navigateToInsertView} action is invoked.
         */
        insertView: null,
        /**
         * @property {String}
         * The view id to show when the {@link #navigateToContextView} action is invoked.
         */
        contextView: false,
        /**
         * @property {Object}
         * A dictionary of hash tag search queries.  The key is the hash tag, without the symbol, and the value is
         * either a query string, or a function that returns a query string.
         */
        hashTagQueries: null,
        /**
         * The text displayed in the more button.
         * @type {String}
         */
        moreText: 'Retrieve More Records',
        /**
         * @property {String}
         * The text displayed in the emptySelection button.
         */
        emptySelectionText: 'None',
        /**
         * @property {String}
         * The text displayed as the default title.
         */
        titleText: 'List',
        /**
         * @property {String}
         * The format string for the text displayed for the remaining record count.  This is used in a {@link String#format} call.
         */
        remainingText: '${0} records remaining',
        /**
         * @property {String}
         * The text displayed on the cancel button.
         * @deprecated
         */
        cancelText: 'Cancel',
        /**
         * @property {String}
         * The text displayed on the insert button.
         * @deprecated
         */
        insertText: 'New',
        /**
         * @property {String}
         * The text displayed when no records are available.
         */
        noDataText: 'no records',
        /**
         * @property {String}
         * The text displayed when data is being requested.
         */
        loadingText: 'loading...',
        /**
         * @property {String}
         * The text displayed when a data request fails.
         */
        requestErrorText: 'A server error occurred while requesting data.',
        /**
         * @property {String}
         */
        customizationSet: 'list',
        selectIcon: 'content/images/icons/OK_24.png',
        searchWidget: null,
        searchWidgetClass: SearchWidget,
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
        postCreate: function() {
            this.inherited(arguments);

            if (this._selectionModel == null)
                this.set('selectionModel', new ConfigurableSelectionModel());

            this.subscribe('/app/refresh', this._onRefresh);

            if (this.enableSearch)
            {
                var searchWidgetCtor = lang.isString(this.searchWidgetClass)
                    ? lang.getObject(this.searchWidgetClass, false)
                    : this.searchWidgetClass;

                this.searchWidget = this.searchWidget || new searchWidgetCtor({
                    'class': 'list-search',
                    'owner': this,
                    'onSearchExpression': lang.hitch(this, this._onSearchExpression)
                });
                this.searchWidget.placeAt(this.searchNode, 'replace');
            }
            else
            {
                this.searchWidget = null;
            }

            domClass.toggle(this.domNode, 'list-hide-search', this.hideSearch);

            this.clear();
        },
        startup: function() {
            this.inherited(arguments);

            if (this.searchWidget)
                this.searchWidget.configure({
                    'hashTagQueries': this._createCustomizedLayout(this.createHashTagQueryLayout(), 'hashTagQueries'),
                    'formatSearchQuery': lang.hitch(this, this.formatSearchQuery)
                });

            this.createActions(this._createCustomizedLayout(this.createActionLayout(), 'actions'));
        },
        destroy: function() {
			if (this.searchWidget)
            {
				if(!this.searchWidget._destroyed)
                    this.searchWidget.destroyRecursive();

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
            var node = dom.byId(tag) || query('li[data-key="'+key+'"]', this.contentNode)[0];
            if (!node) return;

            if (this.enableActions)
            {
                this.showActionPanel(node);
                return;
            }

            domClass.add(node, 'list-item-selected');
        },
        _onSelectionModelDeselect: function(key, data, tag) {
            var node = dom.byId(tag) || query('li[data-key="'+key+'"]', this.contentNode)[0];
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
                        this.activateEntry({
                            key: previousSelections[i],
                            descriptor: previousSelections[i],
                            $source: row
                        });
                }
            }
        },
        _onRefresh: function(options) {
            if (this.resourceKind && options.resourceKind === this.resourceKind)
            {
                this.refreshRequired = true;
            }
        },
        selectEntry: function(params, evt, node) {
            var row = query(node).closest('[data-key]')[0],
                key = row ? row.getAttribute('data-key') : false;

            if (this._selectionModel && key)
                this._selectionModel.toggle(key, this.entries[key], row);

            if (this.options.singleSelect && this.options.singleSelectAction && !this.enableActions)
                this.invokeSingleSelectAction();
        },
        activateEntry: function(params) {
            if (params.key)
            {
                if (this._selectionModel && this.isNavigationDisabled())
                {
                    this._selectionModel.toggle(params.key, this.entries[params.key] || params.descriptor, params.$source);
                    if (this.options.singleSelect && this.options.singleSelectAction)
                        this.invokeSingleSelectAction();
                }
                else
                {
                    this.navigateToDetailView(params.key, params.descriptor);
                }
            }
        },
        invokeSingleSelectAction: function() {
            if (App.bars['tbar'])
                App.bars['tbar'].invokeTool({tool: this.options.singleSelectAction});

            if (this.autoClearSelection)
                this._selectionModel.clear();
        },
        formatRelatedQuery: function(entry, fmt, property) {
            return string.substitute(fmt, [lang.getObject(property || '$key', false, entry)]);
        },
        formatSearchQuery: function(searchQuery) {
            /// <summary>
            ///     Called to transform a textual query into an SData query compatible search expression.
            /// </summary>
            /// <returns type="String">An SData query compatible search expression.</returns>
            return false;
        },
        escapeSearchQuery: function(searchQuery) {
            return (searchQuery || '').replace(/"/g, '""');
        },
        _onSearchExpression: function(expression) {

            this.clear(false);
            this.queryText = '';
            this.query = expression;

            this.requestData();
        },
        configureSearch: function() {
            this.query = this.options && this.options.query || null;
            if (this.searchWidget)
                this.searchWidget.configure({
                    'context': this.getContext()
                });
        },
        createRequest:function(o) {
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

            var contractName = this.expandExpression((options && options.contractName) || this.contractName);
            if (contractName)
                request.setContractName(contractName);

            var resourceKindExpr = this.expandExpression((options && options.resourceKind) || this.resourceKind);
            if (resourceKindExpr)
                request.setResourceKind(resourceKindExpr);

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

            var querySelectExpr = this.expandExpression((options && options.select) || this.querySelect);
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
        navigateToRelatedView:  function(action, selection, viewId, whereQueryFmt) {
            var view = App.getView(viewId),
                options = {
                    where: string.substitute(whereQueryFmt, [selection.data['$key']])
                };

            if (view && options)
                view.show(options);
        },
        navigateToDetailView: function(key, descriptor) {
            /// <summary>
            ///     Navigates to the requested detail view.
            /// </summary>
            var view = App.getView(this.detailView);
            if (view)
                view.show({
                    descriptor: descriptor,
                    key: key
                });
        },
        navigateToEditView: function(action, selection) {
            var view = App.getView(this.editView || this.insertView);
            if (view)
            {
                view.show({
                    key: selection.data['$key']
                });
            }
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

                if (o.length > 0)
                    domConstruct.place(o.join(''), this.contentNode, 'last');
            }

            // todo: add more robust handling when $totalResults does not exist, i.e., hide element completely
            if (typeof this.feed['$totalResults'] !== 'undefined')
            {
                var remaining = this.feed['$totalResults'] - (this.feed['$startIndex'] + this.feed['$itemsPerPage'] - 1);
                this.set('remainingContent', string.substitute(this.remainingText, [remaining]));
            }

            domClass.toggle(this.domNode, 'list-has-more', this.hasMoreData());

            if (this.options.allowEmptySelection)
                domClass.add(this.domNode, 'list-has-empty-opt');

            this._loadPreviousSelections();
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
            alert(string.substitute(this.requestErrorText, [response, o]));
            ErrorManager.addError(response, o, this.options, 'failure');
            domClass.remove(this.domNode, 'list-loading');
        },
        onRequestDataAborted: function(response, o) {
            this.options = false; // force a refresh
            ErrorManager.addError(response, o, this.options, 'aborted');

            domClass.remove(this.domNode, 'list-loading');
        },
        onRequestDataSuccess: function(feed) {
            this.processFeed(feed);

            domClass.remove(this.domNode, 'list-loading');
        },
        requestData: function() {
            /// <summary>
            ///     Initiates the SData request.
            /// </summary>

            domClass.add(this.domNode, 'list-loading');

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

            domClass.toggle(this.domNode, 'list-hide-search', (this.options && typeof this.options.hideSearch !== 'undefined')
                ? this.options.hideSearch
                : this.hideSearch);

            domClass.toggle(this.domNode, 'list-show-selectors', !this.isSelectionDisabled() && !this.options.singleSelect);

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
                    'key': name,
                    'tag': (this.hashTagQueriesText && this.hashTagQueriesText[name]) || name,
                    'query': this.hashTagQueries[name]
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

            domClass.remove(this.domNode, 'list-has-more');

            this.set('listContent', this.loadingTemplate.apply(this));
        }
    });
});
