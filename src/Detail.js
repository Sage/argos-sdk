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

define('Sage/Platform/Mobile/Detail', [
    'dojo',
    'dojo/_base/declare',
    'dojo/_base/connect',
    'dojo/_base/lang',
    'dojo/_base/Deferred',
    'dojo/string',
    'dojo/dom',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojo/dom-construct',
    './Format',
    './Utility',
    './ErrorManager',
    './View',
    './ScrollContainer',
    './TitleBar',
    'argos!customizations',
    'argos!scene'
], function(
    dojo,
    declare,
    connect,
    lang,
    Deferred,
    string,
    dom,
    domClass,
    domAttr,
    domConstruct,
    format,
    utility,
    ErrorManager,
    View,
    ScrollContainer,
    TitleBar,
    customizations,
    scene
) {
    /* todo: make release note that `raw` has been changed to `value` and `value` to `formatted` */

    var defaultPropertyProvider = function(item, property, info) {
            return utility.getValue(item, property, item);
        },
        applyValueTemplate = function(data, container) {
            return data['valueTemplate'].apply(data.value, container);
        };

    var Detail = declare('Sage.Platform.Mobile.Detail', [View], {
        events: {
            'click': true
        },
        components: [
            {name: 'fix', content: '<a href="#" class="android-6059-fix">fix for android issue #6059</a>'},
            {name: 'scroller', type: ScrollContainer, subscribeEvent: 'onContentChange:onContentChange', components: [
                {name: 'scroll', tag: 'div', components: [
                    {name: 'content', tag: 'div', attrs: {'class': 'detail-content'}, attachPoint: 'contentNode'}
                ]}
            ]}
        ],
        baseClass: 'view detail',
        _setDetailContentAttr: {node: 'contentNode', type: 'innerHTML'},
        emptyTemplate: new Simplate([
        ]),
        loadingTemplate: new Simplate([
            '<div class="loading-indicator">',
            '<div>{%: $.loadingText %}</div>',
            '</div>'
        ]),
        sectionTemplate: new Simplate([
            '{% if ($.title !== false) { %}',
            '<h2 data-action="toggleCollapse" class="{% if ($.collapsed) { %}is-collapsed{% } %}">',
                '<span>{%: ($.title) %}</span>',
                '<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '{% } %}',
            '{% if ($.list) { %}',
            '<ul class="{%= $.cls %}"></ul>',
            '{% } else { %}',
            '<div class="{%= $.cls %}"></div>',
            '{% } %}'
        ]),
        propertyItemTemplate: new Simplate([
            '<label>{%: $.label %}</label>',
            '<span>{%= $.formatted %}</span>'
        ]),
        relatedItemTemplate: new Simplate([
            '{% if ($.key) { %}',
            '<label>{%: $.label %}</label>',
            '<span>',
            '<a data-action="navigateToRelatedView" data-view="{%= $.view %}" data-context="{%: $.context %}" data-descriptor="{%: $.descriptor %}">',
            '{%= $.formatted %}',
            '</a>',
            '</span>',
            '{% } else { %}',
            '<a data-action="navigateToRelatedView" data-view="{%= $.view %}" data-context="{%: $.context %}" data-descriptor="{%: $.descriptor %}">',
            '{% if ($.icon) { %}<img src="{%= $.icon %}" alt="icon" class="icon" />{% } %}',
            '<span>{%: $.label %}</span>',
            '</a>',
            '{% } %}'
        ]),
        actionItemTemplate: new Simplate([
            '<a data-action="{%= $.action %}" {% if ($.disabled) { %}data-disable-action="true"{% } %} class="{% if ($.disabled) { %}disabled{% } %}">',
            '{% if ($.icon) { %}',
            '<img src="{%= $.icon %}" alt="icon" class="icon" />',
            '{% } %}',
            '<label>{%: $.label %}</label>',
            '<span>{%= $.formatted %}</span>',
            '</a>'
        ]),
        standardRowTemplate: new Simplate([
            '<div class="row {%= $.cls %}" data-property="{%= $.property || $.name %}">',
            '{%! $.itemTemplate %}',
            '</div>'
        ]),
        listRowTemplate: new Simplate([
            '<li class="row {%= $.cls %}" data-property="{%= $.property || $.name %}">',
            '{%! $.itemTemplate %}',
            '</li>'
        ]),
        notAvailableTemplate: new Simplate([
            '<div class="not-available">{%: $.notAvailableText %}</div>'
        ]),
        tier: 1,
        store: null,
        layout: null,
        security: false,
        customizationSet: 'detail',
        editText: 'Edit',
        titleText: 'Detail',
        detailsText: 'Details',
        toggleCollapseText: 'toggle collapse',
        loadingText: 'loading...',
        requestErrorText: 'A server error occurred while requesting data.',
        notAvailableText: 'The requested entry is not available.',
        editView: false,
        _navigationOptions: null,

        onStartup: function() {
            this.inherited(arguments);

            this.subscribe('/app/refresh', this._onRefresh);
            this.clear();
        },
        onDestroy: function() {
            this.inherited(arguments);

            delete this.store();
        },
        _getStoreAttr: function() {
            return this.store || (this.store = this.createStore());
        },
        createToolLayout: function() {
            return this.tools || (this.tools = {
                'top': [{
                    name: 'edit',
                    label: this.editText,
                    action: 'navigateToEditView',
                    security: App.getViewSecurity(this.editView, 'update')
                }]
            });
        },
        _onRefresh: function(o) {
            /* todo: change to be something non-sdata specific */
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
        formatRelatedQuery: function(entry, fmt, property) {
            property = property || '$key';
            return string.substitute(fmt, [utility.getValue(entry, property)]);
        },
        toggleCollapse: function(evt, node) {
            if (node) domClass.toggle(node, 'is-collapsed');

            this.onContentChange();
        },
        navigateToEditView: function() {
            scene().showView(this.editView, {
                item: this.item
            });
        },
        navigateToRelatedView: function(evt, node) {
            var view = domAttr.get(node, 'data-view'),
                slot = domAttr.get(node, 'data-context'),
                descriptor = domAttr.get(node, 'data-descriptor'),
                options = this._navigationOptions[slot];
            if (options && descriptor)
                options['descriptor'] = descriptor;

            scene().showView(view, options);
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
            var customizationSet = customizations(),
                layout = customizationSet.apply(customizationSet.toPath(this.customizationSet, null, this.id), this.createLayout());

            this.item = this._processItem(item);

            this._processLayout(layout, this.item);
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

            connect.publish('/app/toolbar/update', []);
        },
        _onGetError: function(getOptions, error) {
            if (error.aborted)
            {
                this.options = false; // force a refresh
            }
            else if (error.status == 404)
            {
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'only');
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
        _buildGetExpression: function() {
            var options = this.options;

            return options && (options.id || options.key);
        },
        _applyStateToGetOptions: function(getOptions) {

        },
        createLayout: function() {
            return this.layout || [];
        },
        _processLayoutRowValue: function(row, item) {
            var provider = row['provider'] || defaultPropertyProvider,
                property = typeof row['property'] == 'string'
                    ? row['property']
                    : row['name'],
                value = typeof row['value'] === 'undefined'
                    ? provider(item, property)
                    : this.expandExpression(row['value'], item);

            return value;
        },
        _processLayoutRow: function(layout, row, item, sectionNode) {
            var value = this._processLayoutRowValue(row, item);

            /* a generator creates markup */
            if (typeof row['generator'] === 'function')
            {
                var dynamicNode = row['generator'].call(this, row, value, item);
                if (dynamicNode) domConstruct.place(dynamicNode, sectionNode);
            }
            else
            {
                var provider = row['provider'] || defaultPropertyProvider,
                    rendered,
                    formatted;

                if (row['template'])
                {
                    rendered = (row['template']).apply(value, this);
                    formatted = row['encode'] === true
                        ? format.encode(rendered)
                        : rendered;
                }
                else if (row['renderer'] && typeof row['renderer'] === 'function')
                {
                    rendered = row['renderer'].call(this, value);
                    formatted = row['encode'] === true
                        ? format.encode(rendered)
                        : rendered;
                }
                else
                {
                    formatted = typeof value !== 'object'
                        ? row['encode'] !== false ? format.encode(value) : value
                        : '';
                }

                var data = lang.mixin({}, row, {
                    entry: item,
                    value: value,
                    formatted: formatted
                });

                if (row['descriptor'])
                    data['descriptor'] = typeof row['descriptor'] === 'function'
                        ? this.expandExpression(row['descriptor'], item, value)
                        : provider(item, row['descriptor']);

                if (row['action'])
                    data['action'] = this.expandExpression(row['action'], item, value);

                var hasAccess = App.hasAccessTo(row['security']);
                if (row['security'])
                    data['disabled'] = !hasAccess;

                if (row['disabled'] && hasAccess)
                    data['disabled'] = this.expandExpression(row['disabled'], item, value);

                if (row['view'])
                {
                    var context = lang.mixin({}, row['options']);
                    if (row['key'])
                        context['key'] = typeof row['key'] === 'function'
                            ? this.expandExpression(row['key'], item)
                            : provider(item, row['key']);
                    if (row['where'])
                        context['where'] = this.expandExpression(row['where'], item);
                    if (row['resourceKind'])
                        context['resourceKind'] = this.expandExpression(row['resourceKind'], item);
                    if (row['resourceProperty'])
                        context['resourceProperty'] = this.expandExpression(row['resourceProperty'], item);
                    if (row['resourcePredicate'])
                        context['resourcePredicate'] = this.expandExpression(row['resourcePredicate'], item);

                    data['view'] = row['view'];
                    data['context'] = (this._navigationOptions.push(context) - 1);
                }

                var useListTemplate = layout['list'],
                    rowTemplate = (row['rowTemplate'] || row['use'])
                        ? (row['rowTemplate'] || row['use'])
                        : useListTemplate
                            ? this.listRowTemplate
                            : this.standardRowTemplate;

                data['valueTemplate'] = row['valueTemplate'];
                data['itemTemplate'] = row['valueTemplate']
                    ? {apply: applyValueTemplate}
                    : row['itemTemplate']
                        ? row['itemTemplate']
                        : row['view']
                            ? this.relatedItemTemplate
                            : row['action']
                                ? this.actionItemTemplate
                                : this.propertyItemTemplate;

                data['itemTemplate'] = row['itemTemplate']
                    ? row['itemTemplate']
                    : row['view']
                        ? this.relatedItemTemplate
                        : row['action']
                            ? this.actionItemTemplate
                            : this.propertyItemTemplate;

                var node = domConstruct.place(rowTemplate.apply(data, this), sectionNode);

                if (row['onCreate'])
                    row['onCreate'].call(this, row, node, value, item);
            }
        },
        _processLayout: function(layout, item) {
            var rows = typeof layout['children'] === 'function'
                    ? layout['children'].call(this, layout, this._processLayoutRowValue(layout, item), item)
                    : layout['children']
                        ? layout['children']
                        : layout,
                sectionQueue = [],
                sectionStarted = false,
                i, current;

            for (i = 0; i < rows.length; i++) {
                current = rows[i];

                var section,
                    sectionNode,
                    include = this.expandExpression(current['include'], item),
                    exclude = this.expandExpression(current['exclude'], item);

                if (include !== undefined && !include) continue;
                if (exclude !== undefined && exclude) continue;

                if (current['children'])
                {
                    /* todo: do we need to defer anymore? */
                    if (sectionStarted)
                        sectionQueue.push(current);
                    else
                        this._processLayout(current, item);

                    continue;
                }

                if (!sectionStarted)
                {
                    sectionStarted = true;
                    section = domConstruct.toDom(this.sectionTemplate.apply(layout, this));
                    sectionNode = section.lastChild || section;
                    domConstruct.place(section, this.contentNode);
                }

                this._processLayoutRow(layout, current, item, sectionNode);
            }

            for (i = 0; i < sectionQueue.length; i++)
            {
                current = sectionQueue[i];

                this._processLayout(current, item);
            }
        },
        refreshRequiredFor: function(options) {
            if (this.options)
            {
                if (options)
                {
                    if (this.options.key !== options.key) return true;
                }

                return false;
            }
            else
                return this.inherited(arguments);
        },
        activate: function(options) {
            if (options && options.descriptor)
                options.title = options.title || options.descriptor;

            this.inherited(arguments);
        },
        getTag: function() {
            return this.options && this.options.key;
        },
        getContext: function() {
            var options = this.options,
                id = options.id || options.key;

            return lang.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind,
                label: this.options.title,
                id: id
            });
        },
        beforeTransitionTo: function() {
            this.inherited(arguments);

            if (this.refreshRequired)
            {
                this.clear();
            }
        },
        load: function() {
            this.inherited(arguments);

            /* todo: why is this here? */
            if (this.security && !App.hasAccessTo(this.expandExpression(this.security)))
            {
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'last');
                return;
            }

            this._requestData();
        },
        transitionTo: function() {
            this.inherited(arguments);
        },
        clear: function() {
            this._navigationOptions = [];

            domConstruct.place(this.loadingTemplate.apply(this), this.contentNode, 'only');

            domClass.add(this.domNode, 'is-loading');
        }
    });

    return Detail;
});
