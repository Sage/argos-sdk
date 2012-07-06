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
        sectionBeginTemplate: new Simplate([
            '<h2 data-action="toggleSection" class="{% if ($.collapsed || $.options.collapsed) { %}collapsed{% } %} {% if ($.title === false || $.options.title == false) { %}hidden-section{% } %}">',
            '{%: ($.title || $.options.title) %}<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '{% if ($.list || $.options.list) { %}',
            '<ul class="{%= ($.cls || $.options.cls) %}">',
            '{% } else { %}',
            '<div class="{%= ($.cls || $.options.cls) %}">',
            '{% } %}'
        ]),
        sectionEndTemplate: new Simplate([
            '{% if ($.list || $.options.list) { %}',
            '</ul>',
            '{% } else { %}',
            '</div>',
            '{% } %}'
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
                    id: 'edit',
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
                entry: this.entry
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

            this.entry = this.processItem(item);

            this.processLayout(layout, this.entry);

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
        processLayout: function(layout, entry) {
            var rows = (layout['children'] || layout['as'] || layout),
                options = layout['options'] || (layout['options'] = {
                    title: this.detailsText
                }),
                sectionQueue = [],
                sectionStarted = false,
                callbacks = [],
                i, current;

            for (i = 0; i < rows.length; i++) {
                current = rows[i];

                var section,
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

            for (i = 0; i < callbacks.length; i++)
            {
                current = callbacks[i];
                current.row['onCreate'].apply(this, [current.row, current.node, current.value, current.entry]);
            }

            for (i = 0; i < sectionQueue.length; i++)
            {
                current = sectionQueue[i];

                this.processLayout(current, entry);
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
