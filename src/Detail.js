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
    'dojo/_base/lang',
    'dojo/string',
    'dojo/dom',
    'dojo/dom-class',
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
    lang,
    string,
    dom,
    domClass,
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

    var defaultPropertyProvider = function(item, property, info) {
        return utility.getValue(item, property, item);
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
            '<h2 data-action="toggleSection" class="{% if ($.collapsed) { %}is-collapsed{% } %} {% if ($.title === false) { %}is-hidden{% } %}">',
            '{%: ($.title) %}<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '{% if ($.list) { %}',
            '<ul class="{%= $.cls %}"></ul>',
            '{% } else { %}',
            '<div class="{%= $.cls %}"></div>',
            '{% } %}'
        ]),

        valueTemplate: new Simplate([
            '<div class="row {%= $.cls %}" data-property="{%= $.property || $.name %}">',
            '<label>{%: $.label %}</label>',
            '<span>{%= $.value %}</span>', // todo: create a way to allow the value to not be surrounded with a span tag
            '</div>'
        ]),

        propertyTemplate: new Simplate([
            '<div class="row {%= $.cls %}" data-property="{%= $.property || $.name %}">',
            '<label>{%: $.label %}</label>',
            '<span>{%= $.value %}</span>', // todo: create a way to allow the value to not be surrounded with a span tag
            '</div>'
        ]),
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

        onCreate: function() {
            this.inherited(arguments);
            this.subscribe('/app/refresh', this._onRefresh);
            this.clear();
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
            console.log(fmt, entry, property);
            return string.substitute(fmt, [utility.getValue(entry, property)]);
        },
        toggleSection: function(evt, node) {
            if (node) domClass.toggle(node, 'collapsed');

            this.onContentChange();
        },
        activateRelatedEntry: function(params) {
            if (params.context) this.navigateToRelatedView(params.view, parseInt(params.context, 10), params.descriptor);
        },
        activateRelatedList: function(params) {
            if (params.context) this.navigateToRelatedView(params.view, parseInt(params.context, 10), params.descriptor);
        },
        navigateToEditView: function(el) {
            scene().showView(this.editView, {
                item: this.item
            });
        },
        navigateToRelatedView: function(id, slot, descriptor) {
            var options = this._navigationOptions[slot],
                view = App.getView(id);

            if (descriptor && options) options['descriptor'] = descriptor;

            if (view && options)
                view.show(options);
        },
        createStore: function() {
            return null;
        },
        processItem: function(item) {
            return item;
        },
        onContentChange: function() {
        },
        _onFetchItem: function(item) {
            var customizationSet = customizations(),
                layout = customizationSet.apply(customizationSet.toPath(this.customizationSet, null, this.id), this.createLayout());

            this.item = this.processItem(item);

            this._processLayout(layout, this.item);

            domClass.remove(this.domNode, 'is-loading');

            /* this must take place when the content is visible */
            this.onContentChange();
        },
        _onFetchError: function(error, keywordArgs) {
            if (error.status == 404)
            {
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'only');
            }
            else
            {
                alert(string.substitute(this.requestErrorText, [error]));

                ErrorManager.addError(error, keywordArgs, this.options, 'failure');
            }

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
                    onError: this._onFetchError,
                    onAbort: this._onFetchAbort,
                    onItem: this._onFetchItem
                };

            this.applyOptionsToFetchItem(keywordArgs);

            return store.fetchItemByIdentity(keywordArgs);
        },
        applyOptionsToFetchItem: function(keywordArgs) {
            var options = this.options;

            if (options)
            {
                if (options.key) keywordArgs.identity = options.key;
            }
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
            /* a creator generates layout */
            else if (typeof row['creator'] === 'function')
            {
                var dynamicLayout = row['creator'].call(this, row, value, item);
                if (dynamicLayout) this._processLayout(dynamicLayout, item);
            }
            else
            {
                var provider = row['provider'] || defaultPropertyProvider,
                    rendered,
                    formatted;

                if (row['template'] || row['tpl'])
                {
                    rendered = (row['template'] || row['tpl']).apply(value, this);
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
                    formatted = row['encode'] !== false
                        ? format.encode(value)
                        : value;
                }

                var data = lang.mixin({}, row, {
                    entry: item,
                    value: formatted,
                    raw: value
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

                // priority: use > (relatedPropertyTemplate | relatedTemplate) > (actionPropertyTemplate | actionTemplate) > propertyTemplate
                var useListTemplate = layout['list'],
                    template = row['use']
                        ? row['use']
                        : row['view']
                            ? useListTemplate
                                ? this.relatedTemplate
                                : this.relatedPropertyTemplate
                            : row['action']
                                ? useListTemplate
                                    ? this.actionTemplate
                                    : this.actionPropertyTemplate
                                : this.propertyTemplate;

                var node = domConstruct.place(template.apply(data, this), sectionNode);

                if (row['onCreate'])
                    row['onCreate'].call(this, row, node, value, item);
            }
        },
        _processLayout: function(layout, item) {
            var rows = typeof layout['generator'] === 'function'
                    ? layout['generator'].call(this, layout, this._processLayoutRowValue(layout, item), item)
                    : layout['children']
                        ? layout['children']
                        : layout,
                // rows = (layout['children'] || layout),
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

                if (current['children'] || current['generator'])
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
                    sectionNode = section.lastChild;
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
            if (this.options) {
                if (options) {
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
            return lang.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind,
                key: this.options.key,
                descriptor: this.options.descriptor
            });
        },
        beforeTransitionTo: function() {
            this.inherited(arguments);

            if (this.refreshRequired)
            {
                this.clear();
            }
        },
        refresh: function() {
            /* todo: why is this here? */
            if (this.security && !App.hasAccessTo(this.expandExpression(this.security)))
            {
                domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'last');
                return;
            }

            this.requestData();
        },
        transitionTo: function() {
            this.inherited(arguments);
        },
        clear: function() {
            domConstruct.place(this.loadingTemplate.apply(this), this.contentNode, 'only');

            this._navigationOptions = [];
        }
    });

    return Detail;
});
