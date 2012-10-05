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
 * @requires ErrorManager
 * @requires ScrollContainer
 * @requires SearchWidget
 * @requires TitleBar
 * @requires scene
 * @requires CustomizationSet
 */
define('argos/List', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/connect',
    'dojo/_base/Deferred', /* todo: use `dojo/when` in 1.8 */
    'dojo/query',
    'dojo/NodeList-manipulate',
    'dojo/dom-attr',
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
    domAttr,
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

    /**
     * SelectionModel provides a simple in-memory store for data that fires events
     * when a item is selected (added) or deselected (removed)
     * @alternateClassName SelectionModel
     */
    var SelectionModel = declare('argos.SelectionModel', null, {
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
         * @cfg {Boolean}
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
         * Event that happens when an item is selected/added. A View should `connect` this function to a handler.
         * @param {String} key Unique identifier string
         * @param {Object} data The item stored
         * @param tag
         * @param self
         */
        onSelect: function(key, data, tag, self) {
        },
        /**
         * Event that happens when an item is deselected/removed. A View should `connect` this function to a handler.
         * @param {String} key Unique identifier string
         * @param {Object} data The item removed
         * @param tag
         * @param self
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
    var ConfigurableSelectionModel = declare('argos.ConfigurableSelectionModel', [SelectionModel], {
        /**
         * @cfg {Boolean}
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
                this.clear();
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

    return declare('argos.List', [View], {
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
        _setListContentAttr: {node: 'contentNode', type: 'innerHTML'},
        _setRemainingContentAttr: {node: 'remainingContentNode', type: 'innerHTML'},
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
            '<li class="loading-indicator"><div>{%: $.loadingText %}</div></li>'
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
         * @cfg {String} id
         * The id for the view, and it's main DOM element.
         */
        id: 'generic_list',
        tier: 0,
        store: null,
        /**
         * @cfg {String}
         * The SData resource kind the view is responsible for.  This will be used as the default resource kind
         * for all SData requests.
         */
        resourceKind: null,
        /**
         * @cfg {String[]}
         * A list of fields to be selected in an SData request.
         */
        querySelect: null,
        /**
         * @cfg {String[]}
         * Optional list of child properties to be included in an SData request.
         */
        queryInclude: null,
        /**
         * @cfg {String}
         * The default order by expression for an SData request.
         */
        queryOrderBy: null,
        /**
         * @cfg {String/Function}
         * The default where expression for an SData request.
         */
        queryWhere: null,
        /**
         * @cfg {String/Function}
         * The default resource property for an SData request.
         */
        resourceProperty: null,
        /**
         * @cfg {String/Function}
         * The default resource predicate for an SData request.
         */
        resourcePredicate: null,
        /**
         * @cfg {Number}
         * The number of items to request per SData payload.
         */
        pageSize: 20,
        /**
         * @cfg {Boolean}
         * Controls the addition of a search widget.
         */
        enableSearch: true,
        /**
         * @cfg {Boolean}
         * Controls the visibility of the search widget.
         */
        hideSearch: false,
        /**
         * @cfg {Boolean}
         * Flag that determines if the list actions panel should be in use.
         */
        enableActions: false,
        /**
         * @cfg {Boolean}
         * True to allow selections via the SelectionModel in the view.
         */
        allowSelection: false,
        /**
         * @cfg {Boolean}
         * True to clear the selection model when the view is shown.
         */
        autoClearSelection: true,
        /**
         * @cfg {String}
         * The id of the detail view to show when a row is clicked.
         */
        detailView: null,
        /**
         * @cfg {String}
         * The view id to show if there is no `insertView` specified, when
         * the {@link #navigateToInsertView navigateToInsertView} action is invoked.
         */
        editView: null,
        /**
         * @cfg {String}
         * The view id to show when the {@link #navigateToInsertView} action is invoked.
         */
        insertView: null,
        /**
         * @cfg {String}
         * The view id to show when the {@link #navigateToContextView navigateToContextView} action is invoked.
         */
        contextView: false,
        /**
         * The built hash tag layout.
         */
        hashTags: null,
        /**
         * @cfg {Object}
         * A dictionary of hash tag search queries.  The key is the hash tag, without the symbol, and the value is
         * either a query string, or a function that returns a query string.
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
         * @property {String}
         * The text displayed in the more button.
         */
        moreText: 'Retrieve More Records',
        /**
         * @property {String}
         * The text displayed in the emptySelection button.
         */
        emptySelectionText: 'None',
        /**
         * @cfg {String}
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
        loadingText: 'Loading...',
        searchText: 'Search',
        /**
         * @property {String}
         * The text displayed when a data request fails.
         */
        requestErrorText: 'A server error occurred while requesting data.',
        items: {},
        /**
         * @property {String}
         * The customization identifier for this class. When a customization is registered it is passed
         * a path/identifier which is then matched to this property.
         */
        customizationSet: 'list',
        actionsNode: null,
        /**
         * @property {Object}
         * The selection model for the view
         */
        _selectionModel: null,
        /**
         * @property {Object}
         * The selection model event connections
         */
        _selectionConnects: null,
        /**
         * Setter method for the selection model, also binds the various selection model select events
         * to the respective List event handler for each.
         * @param {SelectionModel} selectionModel The selection model instance to save to the view
         */
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
        /**
         * Getter nmethod for the selection model
         * @return {SelectionModel}
         */
        _getSelectionModelAttr: function() {
            return this._selectionModel;
        },
        /**
         * Setups the View including: selection model, search widget, bind to the global refresh publish event, and
         * create actions.
         */
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
        /**
         * Destroys the search widget and store, and disconnect selection events before destroying the view.
         */
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
        /**
         * Sets and returns the toolbar item layout definition, this method should be overriden in the view
         * so that you may define the views toolbar items.
         * @return {Object} this.tools
         * @template
         */
        createToolLayout: function() {
            if (!this.tools) {
                this.tools = {
                    'top': [{
                        id: 'new',
                        action: 'navigateToInsertView',
                        security: App.getViewSecurity(this.insertView, 'insert')
                    }]
                };

                if (1 < scene().layout.tiers)
                    this.tools.top.push({
                        id: 'up',
                        action: 'navigateUp',
                        place: 'left'
                    });
            }

            return this.tools;
        },
        /**
         * Sets and returns the list-action actions layout definition, this method should be overriden in the view
         * so that you may define the action items for that view.
         * @return {Object} this.actions
         * @template
         */
        createActionLayout: function() {
            return this.actions || {};
        },
        /**
         * Creates the action bar and adds it to the DOM. Note that it replaces `this.actions` with the passed
         * param as the passed param should be the result of the customization mixin and `this.actions` needs to be the
         * final actions state.
         * @param {Object[]} actions
         */
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
        /**
         * This is the data-action handler for list-actions, it will locate the action instance viw the data-id attribute
         * and invoke either the `fn` with `scope` or the named `action` on the current view.
         *
         * The resulting function being called will be passed not only the action item definition but also
         * the first (only) selection from the lists selection model.
         *
         * @param {Object} parameters Collection of data- attributes already gathered from the node
         * @param {Event} evt The click/tap event
         * @param {HTMLElement} node The node that invoked the action
         */
        invokeActionItem: function(evt, node) {
            var index = domAttr.get(node, 'data-id'),
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
            else if (action['action'] && this[action['action']])
                    this[action['action']].call(action['scope'] || this, action, selection);
        },
        /**
         * Called when showing the action bar for a newly selected row, it sets the disabled state for each action
         * item using the currently selected row as context by passing the action instance the selected row to the
         * action items `enabled` property.
         */
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
        /**
         * Handler for showing the list-action panel/bar - it needs to do several things:
         *
         * 1. Check each item for context-enabledment
         * 1. Move the action panel to the current row and show it
         * 1. Adjust the scrolling if needed (if selected row is at bottom of screen, the action-bar shows off screen
         * which is bad)
         *
         * @param {HTMLElement} rowNode The currently selected row node
         */
        showActionPanel: function(rowNode) {
            this.checkActionState();

            domClass.add(rowNode, 'list-action-selected');
            domConstruct.place(this.actionsNode, rowNode, 'after');

            if (this.actionsNode.offsetTop + this.actionsNode.clientHeight + 48 > document.documentElement.clientHeight)
                this.actionsNode.scrollIntoView(false);
        },
        /**
         * Sets the `this.options.source` to passed param after adding the views resourceKind. This function is used so
         * that when the next view queries the navigation context we can include the passed param as a data point.
         *
         * @param {Object} source The object to set as the options.source.
         */
        setSource: function(source) {
            lang.mixin(source, {
                resourceKind: this.resourceKind
            });

            this.options.source = source;
        },
        /**
         * Hides the passed list-action row/panel by removing the selected styling
         * @param {HTMLElement} rowNode The currently selected row.
         */
        hideActionPanel: function(rowNode) {
            domClass.remove(rowNode, 'list-action-selected');
        },
        /**
         * Determines if the view is a navigatible view or a selection view by returning `this.selectionOnly` or the
         * navigation `this.options.selectionOnly`.
         * @return {Boolean}
         */
        isNavigationDisabled: function() {
            return ((this.options && this.options.selectionOnly) || (this.selectionOnly));
        },
        /**
         * Determines if the selections are disabled by checking the `allowSelection` and `enableActions`
         * @return {Boolean}
         */
        isSelectionDisabled: function() {
            return !((this.options && this.options.selectionOnly) || this.enableActions || this.allowSelection);
        },
        /**
         * Handler for when the selection model adds an item. Adds the selected state to the row or shows the list
         * actions panel.
         * @param {String} key The extracted key from the selected row.
         * @param {Object} data The actual row's matching data point
         * @param {String/HTMLElement} tag An indentifier, may be the actual row node or some other id.
         */
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
        /**
         * Handler for when the selection model removes an item. Removes the selected state to the row or hides the list
         * actions panel.
         * @param {String} key The extracted key from the de-selected row.
         * @param {Object} data The actual row's matching data point
         * @param {String/HTMLElement} tag An indentifier, may be the actual row node or some other id.
         */
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
        /**
         * Handler for when the selection model clears the selections.
         */
        _onSelectionModelClear: function() {
        },
        /**
         * Attempts to activate entries passed in `this.options.previousSelections` where previousSelections is an array
         * of data-keys or data-descriptors to search the list rows for.
         */
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
        /**
         * Handler for the global `/app/refresh` event. Sets `refreshRequired` to true if the resourceKind matches.
         * @param {Object} options The object published by the event.
         */
        _onRefresh: function(options) {
            if (this.resourceKind && options.resourceKind === this.resourceKind)
            {
                this.refreshRequired = true;
            }
        },
        /**
         * Handler for the select or action node data-action. Finds the nearest node with the data-key attribute and
         * toggles it in the views selection model.
         *
         * If singleSelectAction is defined, invoke the singleSelectionAction.
         *
         * @param {Event} evt The click/tap event.
         * @param {HTMLElement} node The element that initiated the event.
         */
        selectEntry: function(evt, node) {
            var row = query(node).closest('[data-key]')[0],
                key = row ? row.getAttribute('data-key') : false;

            if (this._selectionModel && key)
                this._selectionModel.toggle(key, this.items[key], row);

            if (this.options.singleSelect && this.options.singleSelectAction && !this.enableActions)
                this.invokeSingleSelectAction();
        },
        /**
         * Handler for each row.
         *
         * If a selection model is defined and navigation is disabled then toggle the entry/row
         * in the model and if singleSelectionAction is true invoke the singleSelectAction.
         *
         * Else navigate to the detail view for the extracted data-key.
         *
         * @param {Event} evt The click/tap event.
         * @param {HTMLElement} node The element that initiated the event.
         */
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
        /**
         * Invokes the corresponding top toolbar tool using `this.options.singleSelectAction` as the name.
         * If autoClearSelection is true, clear the selection model.
         */
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
        /**
         * Called to transform a textual query into an SData query compatible search expression.
         *
         * Views should override this function to provide their own formatting tailored to their entity.
         *
         * @param {String} searchQuery User inputted text from the search widget.
         * @return {String/Boolean} An SData query compatible search expression.
         * @template
         */
        formatSearchQuery: function(query) {
            return false;
        },
        formatHashTagQuery: function(query) {
            return false;
        },
        /**
         * Handler for the search widgets search.
         *
         * Prepares the view by clearing it and setting `this.query` to the given search expression. Then calls
         * {@link #requestData requestData} which start the request process.
         *
         * @param {String} expression String expression as returned from the search widget
         */
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
        /**
         * Helper method for list actions. Takes a view id, data point and where format string, sets the nav options
         * `where` to the formatted expression using the data point and shows the given view id with that option.
         * @param {Object} action Action instance, not used.
         * @param {Object} selection Data entry for the selection.
         * @param {String} viewId View id to be shown
         * @param {String} whereQueryFmt Where expression format string to be passed. `${0}` will be the `$key`
         * property of the passed selection data.
         */
        navigateToRelatedView:  function(action, selection, viewId, whereQueryFmt) {
            var options = {};

            if (whereQueryFmt && selection)
                options['where'] = string.substitute(whereQueryFmt, [selection.data['$key']]);

            this.setSource({
                entry: selection.data,
                descriptor: selection.data['$descriptor'],
                key: selection.data['$key']
            });

            scene().showView(viewId, options);
        },
        /**
         * Navigates to the defined `this.detailView` passing the params as navigation options.
         * @param {String} key Key of the entry to be shown in detail
         * @param {String} descriptor Description of the entry, will be used as the top toolbar title text.
         */
        navigateToDetailView: function(key, descriptor) {
            scene().showView(this.detailView, {
                descriptor: descriptor,
                key: key
            });
        },
        /**
         * Helper method for list-actions. Navigates to the defined `this.editView` passing the given selections `$key`
         * property in the navigation options (which is then requested and result used as default data).
         * @param {Object} action Action instance, not used.
         * @param {Object} selection Data entry for the selection.
         */
        navigateToEditView: function(action, selection) {
            scene().showView(this.editView || this.insertView, {
                key: selection.data['$key']
            });
        },
        /**
         * Navigates to the defined `this.insertView`, or `this.editView` passing the current views id as the `returnTo`
         * option and setting `insert` to true.
         * @param {HTMLElement} el Node that initiated the event.
         */
        navigateToInsertView: function() {
            scene().showView(this.insertView || this.editView, {
                returnTo: this.id,
                insert: true
            });
        },
        navigateUp: function() {
            scene().navigateUp();
        },
        onContentChange: function() {
        },
        _processItem: function(item) {
            return item;
        },
        /**
         * Processes the items array from the store and renders out the feed entries.
         *
         * Saves each entry to the `this.items` collection using the entries `$key` as the key.
         *
         * @param {Object[]} items Items to process
         */
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
        /**
         * Handler for the none/no selection button is pressed. Used in selection views when not selecting is an option.
         * Invokes the `this.options.singleSelectAction` tool.
         */
        emptySelection: function() {
            /// <summary>
            ///     Called when the emptySelection/None button is clicked.
            /// </summary>
            this._selectionModel.clear();

            if (App.bars['tbar'])
                App.bars['tbar'].invokeTool({tool: this.options.singleSelectAction}); // invoke action of tool
        },
        /**
         * Determines if the view should be refresh by inspecting and comparing the passed navigation options with current values.
         * @param {Object} options Passed navigation options.
         * @return {Boolean} True if the view should be refreshed, false if not.
         */
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
        /**
         * Returns the current views context by expanding upon the {@link View#getContext parent implementation} to include
         * the views resourceKind.
         * @return {Object} context.
         */
        getContext: function() {
            return lang.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind
            });
        },
        /**
         * Extends the {@link View#beforeTransitionTo parent implementation} by also toggling the visibility of the views
         * components and clearing the view and selection model as needed.
         */
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
        /**
         * Extends the {@link View#transitionTo parent implementation} to also configure the search widget and
         * load previous selections into the selection model.
         */
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
         * Clears the view by:
         *
         *  * clearing the selection model, but without it invoking the event handlers;
         *  * clears the views data such as `this.entries` and `this.feed`;
         *  * clears the search width if passed true; and
         *  * applies the default template.
         *
         * @param {Boolean} all If true, also clear the search widget.
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
});
