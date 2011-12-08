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

define('Sage/Platform/Mobile/Detail', ['Sage/Platform/Mobile/View', 'Sage/Platform/Mobile/Utility', 'Sage/Platform/Mobile/Format'], function() {

    return dojo.declare('Sage.Platform.Mobile.Detail', [Sage.Platform.Mobile.View], {
        attributeMap: {
            detailContent: {node: 'contentNode', type: 'innerHTML'}
        },
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%= $.titleText %}" class="detail panel {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
            '{%! $.loadingTemplate %}',
            '<div class="panel-content" data-dojo-attach-point="contentNode"></div>',
            '</div>'
        ]),
        emptyTemplate: new Simplate([
        ]),
        loadingTemplate: new Simplate([
            '<div class="panel-loading-indicator">',
            '<div class="row"><div>{%: $.loadingText %}</div></div>',
            '</div>'
        ]),
        sectionBeginTemplate: new Simplate([
            '<h2 data-action="toggleSection" class="{% if ($.collapsed || $.options.collapsed) { %}collapsed{% } %}">',
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
        id: 'generic_detail',
        layout: null,
        security: false,
        customizationSet: 'detail',
        expose: false,
        editText: 'Edit',
        titleText: 'Detail',
        detailsText: 'Details',
        toggleCollapseText: 'toggle collapse',
        loadingText: 'loading...',
        requestErrorText: 'A server error occurred while requesting data.',
        notAvailableText: 'The requested entry is not available.',
        editView: false,

        postCreate: function() {
            this.inherited(arguments);
            this.connect(App, 'onRefresh', this._onRefresh);
            this.clear();
        },
        createToolLayout: function() {
            return this.tools || (this.tools = {
                'tbar': [{
                    id: 'edit',
                    action: 'navigateToEditView',
                    security: App.getViewSecurity(this.editView, 'update')
                }]
            });
        },
        invokeAction: function(name, parameters, evt, el) {
            if (parameters && /true/i.test(parameters['disableAction']))
                return;

            return this.inherited(arguments);
        },
        _onRefresh: function(o) {
            var descriptor = o.data && o.data['$descriptor'];

            if (this.options && this.options.key === o.key) {
                this.refreshRequired = true;

                if (descriptor) {
                    this.options.title = descriptor;
                    this.set('title', descriptor);
                }
            }
        },
        formatRelatedQuery: function(entry, fmt, property) {
            var property = property || '$key';

            return dojo.string.substitute(fmt, [Sage.Platform.Mobile.Utility.getValue(entry, property)]);
        },
        toggleSection: function(params) {
            var node = dojo.byId(params.$source);
            if (node)
                dojo.toggleClass(node, 'collapsed');
        },
        activateRelatedEntry: function(params) {
            if (params.context)
                this.navigateToRelatedView(params.view, dojo.fromJson(params.context), params.descriptor);
        },
        activateRelatedList: function(params) {
            if (params.context)
                this.navigateToRelatedView(params.view, dojo.fromJson(params.context), params.descriptor);
        },
        navigateToEditView: function(el) {
            var view = App.getView(this.editView);
            if (view)
                view.show({entry: this.entry});
        },
        navigateToRelatedView: function(view, o, descriptor) {
            var context,
                targetView;
            if (typeof o === 'string') {
                context = {
                    key: o,
                    descriptor: descriptor
                };
            } else {
                context = o;

                if (descriptor) context['descriptor'] = descriptor;
            }

            if (context) {
                targetView = App.getView(view);
                if (targetView)
                    targetView.show(context);
            }
        },
        createRequest: function() {
            var request = new Sage.SData.Client.SDataSingleResourceRequest(this.getService());

            /* test for complex selector */
            /* todo: more robust test required? */
            if (/(\s+)/.test(this.options.key))
                request.setResourceSelector(this.options.key);
            else
                request.setResourceSelector(dojo.string.substitute("'${0}'", [this.options.key]));

            if (this.resourceKind)
                request.setResourceKind(this.resourceKind);

            if (this.querySelect)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Select, this.querySelect.join(','));

            if (this.queryInclude)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Include, this.queryInclude.join(','));

            if (this.queryOrderBy)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.OrderBy, this.queryOrderBy);

            return request;
        },
        createLayout: function() {
            return this.layout || [];
        },
        processLayout: function(layout, entry)
        {
            var rows = (layout['children'] || layout['as'] || layout),
                options = layout['options'] || (layout['options'] = {
                    title: this.detailsText
                }),
                getValue = Sage.Platform.Mobile.Utility.getValue,
                encodeValue = Sage.Platform.Mobile.Format.encode,
                sectionQueue = [],
                sectionStarted = false,
                content = [];

            for (var i = 0; i < rows.length; i++) {
                var current = rows[i],
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
                    content.push(this.sectionBeginTemplate.apply(layout, this));
                }

                var provider = current['provider'] || getValue,
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
                        ? encodeValue(rendered)
                        : rendered;
                }
                else if (current['renderer'] && typeof current['renderer'] === 'function')
                {
                    rendered = current['renderer'].call(this, value);
                    formatted = current['encode'] === true
                        ? encodeValue(rendered)
                        : rendered;
                }
                else
                {
                    formatted = current['encode'] !== false
                        ? encodeValue(value)
                        : value;
                }

                var data = dojo.mixin({}, {
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

                if (current['view']) {
                    var context = {};
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
                    data['context'] = dojo.toJson(context);
                }

                // priority: wrap > (relatedPropertyTemplate | relatedTemplate) > (actionPropertyTemplate | actionTemplate) > propertyTemplate
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

                content.push(template.apply(data, this));
            }

            if (sectionStarted) content.push(this.sectionEndTemplate.apply(layout, this));

            dojo.query(this.contentNode).append(content.join(''));

            for (var i = 0; i < sectionQueue.length; i++)
            {
                var current = sectionQueue[i];
                
                this.processLayout(current, entry);
            }
        },
        processEntry: function(entry) {
            this.entry = entry;

            if (this.entry)
            {
                this.processLayout(this._createCustomizedLayout(this.createLayout()), this.entry);
            }
            else
            {
                this.set('detailContent', '');
            }
        },
        onRequestDataFailure: function(response, o) {
            if (response && response.status == 404)
            {
                dojo.query(this.contentNode).append(this.notAvailableTemplate.apply(this));
            }
            else
            {
                alert(dojo.string.substitute(this.requestErrorText, [response, o]));
                Sage.Platform.Mobile.ErrorManager.addError(response, o, this.options, 'failure');
            }

            dojo.removeClass(this.domNode, 'panel-loading');
        },
        onRequestDataAborted: function(response, o) {
            this.options = false; // force a refresh
            Sage.Platform.Mobile.ErrorManager.addError(response, o, this.options, 'aborted');
            dojo.removeClass(this.domNode, 'panel-loading');
        },
        onRequestDataSuccess: function(entry) {
            this.processEntry(entry);
            dojo.removeClass(this.domNode, 'panel-loading');
        },
        requestData: function() {
            dojo.addClass(this.domNode, 'panel-loading');

            var request = this.createRequest();
            if (request)
                request.read({
                    success: this.onRequestDataSuccess,
                    failure: this.onRequestDataFailure,
                    aborted: this.onRequestDataAborted,
                    scope: this
                });
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
        activate: function(tag, data) {
            var options = data && data.options;
            if (options && options.descriptor)
                options.title = options.title || options.descriptor;

            this.inherited(arguments);
        },
        show: function(options) {
            if (options && options.descriptor)
                options.title = options.title || options.descriptor;

            this.inherited(arguments);
        },
        getTag: function() {
            return this.options && this.options.key;
        },
        getContext: function() {
            return dojo.mixin(this.inherited(arguments), {
                resourceKind: this.resourceKind,
                key: this.options.key,
                descriptor: this.options.descriptor
            });
        },
        beforeTransitionTo: function() {
            this.inherited(arguments);

            this.canEdit = this.editor ? true : false;

            if (this.refreshRequired)
            {
                this.clear();
            }
        },
        refresh: function() {
            if (this.security && !App.hasAccessTo(this.expandExpression(this.security)))
            {
                dojo.query(this.contentNode).append(this.notAvailableTemplate.apply(this));
                return;
            }

            this.requestData();
        },
        transitionTo: function() {
            this.inherited(arguments);
        },
        clear: function() {
            this.set('detailContent', this.emptyTemplate.apply(this));
            this.context = false;
        }
    });
});
