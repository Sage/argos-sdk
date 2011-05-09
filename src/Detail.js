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
    Sage.Platform.Mobile.Detail = Ext.extend(Sage.Platform.Mobile.View, {
        attachmentPoints: {
            contentEl: '.panel-content'
        },
        viewTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="detail panel {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
            '{%! $.loadingTemplate %}',
            '<div class="panel-content"></div>',
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
            '<h2 data-action="toggleSection" class="{% if ($.collapsed) { %}collapsed{% } %}">',
            '{%: $.title %}<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '{% if ($.list) { %}<ul class="{%= $.cls %}">{% } else { %}<div class="{%= $.cls %}">{% } %}'
        ]),
        sectionEndTemplate: new Simplate([
            '{% if ($.list) { %}</ul>{% } else { %}</div>{% } %}'
        ]),
        propertyTemplate: new Simplate([
            '<div class="row {%= $.cls %}" data-property="{%= $.name %}">',
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
        layoutCompiled: null,
        layoutCompiledFrom: null,
        enableCustomizations: true,
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
        init: function() {
            Sage.Platform.Mobile.Detail.superclass.init.call(this);

            this.tools.tbar = [{
                id: 'edit',
                action: 'navigateToEditView'
            }];

            this.clear();
        },
        initEvents: function() {
            Sage.Platform.Mobile.Detail.superclass.initEvents.call(this);

            App.on('refresh', this._onRefresh, this);
        },
        invokeAction: function(name, parameters, evt, el) {
            if (parameters && /true/i.test(parameters['disableAction']))
                return;

            return Sage.Platform.Mobile.Detail.superclass.invokeAction.apply(this, arguments);
        },
        _onRefresh: function(o) {
            if (this.options && this.options.key === o.key)
            {
                this.refreshRequired = true;

                var descriptor = o.data && o.data['$descriptor'];
                if (descriptor)
                {
                    this.options.title = descriptor;
                    this.setTitle(descriptor);
                }
            }
        },
        formatRelatedQuery: function(entry, fmt, property) {
            var property = property || '$key';

            return String.format(fmt, Sage.Platform.Mobile.Utility.getValue(entry, property));
        },
        toggleSection: function(params) {
            var el = Ext.get(params.$source);
            if (el)
                el.toggleClass('collapsed');
        },
        activateRelatedEntry: function(params) {
            if (params.context) this.navigateToRelatedView(params.view, Ext.decode(params.context), params.descriptor);
        },
        activateRelatedList: function(params) {
            if (params.context) this.navigateToRelatedView(params.view, Ext.decode(params.context), params.descriptor);
        },
        navigateToEditView: function() {
            var view = App.getView(this.editView);
            if (view)
                view.show({entry: this.entry});
        },
        navigateToRelatedView: function(view, o, descriptor) {
            if (typeof o === 'string')
                var context = {
                    key: o,
                    descriptor: descriptor
                };
            else
            {
                var context = o;

                if (descriptor) context['descriptor'] = descriptor;
            }

            if (context)
            {
                var v = App.getView(view);
                if (v)
                    v.show(context);
            }
        },
        createRequest: function() {
            var request = new Sage.SData.Client.SDataSingleResourceRequest(this.getService());

            /* test for complex selector */
            /* todo: more robust test required? */
            if (/(\s+)/.test(this.options.key))
                request.setResourceSelector(this.options.key);
            else
                request.setResourceSelector(String.format("'{0}'", this.options.key));

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
        createLayout: function() {
            return this.layout || [];
        },
        processLayout: function(layout, layoutOptions, entry)
        {
            var sectionQueue = [],
                sectionStarted = false,
                content = [];

            for (var i = 0; i < layout.length; i++)
            {
                var current = layout[i];
                var include = this.expandExpression(current['include'], entry),
                    exclude = this.expandExpression(current['exclude'], entry);

                if (include !== undefined && !include) continue;
                if (exclude !== undefined && exclude) continue;

                if (current['as'])
                {
                    if (sectionStarted)
                        sectionQueue.push(current);
                    else
                        this.processLayout(current['as'], current['options'], entry);

                    continue;
                }

                if (!sectionStarted)
                {
                    sectionStarted = true;
                    content.push(this.sectionBeginTemplate.apply(layoutOptions, this));
                }

                var provider = current['provider'] || Sage.Platform.Mobile.Utility.getValue,
                    value = typeof current['value'] === 'undefined'
                        ? provider(entry, current['name'])
                        : current['value'];

                if (current['template'] || current['tpl'])
                {
                    var rendered = (current['template'] || current['tpl']).apply(value, this),
                        formatted = current['encode'] === true
                            ? Sage.Platform.Mobile.Format.encode(rendered)
                            : rendered;
                }
                else if (current['renderer'] && typeof current['renderer'] === 'function')
                {
                    var rendered = current['renderer'].call(this, value),
                        formatted = current['encode'] === true
                            ? Sage.Platform.Mobile.Format.encode(rendered)
                            : rendered;
                }
                else
                {
                    var formatted = current['encode'] !== false
                        ? Sage.Platform.Mobile.Format.encode(value)
                        : value;
                }

                var options = Ext.apply({}, {
                    entry: entry,
                    value: formatted,
                    raw: value
                }, current);
        
                if (current['descriptor'])
                    options['descriptor'] = typeof current['descriptor'] === 'function'
                        ? this.expandExpression(current['descriptor'], entry, value)
                        : provider(entry, current['descriptor']);

                if (current['action'])
                    options['action'] = this.expandExpression(current['action'], entry, value);

                if (current['disabled'])
                    options['disabled'] = this.expandExpression(current['disabled'], entry, value);

                if (current['view'])
                {
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

                    options['view'] = current['view'];
                    options['context'] = Ext.util.JSON.encode(context);
                }

                // priority: wrap > (relatedPropertyTemplate | relatedTemplate) > (actionPropertyTemplate | actionTemplate) > propertyTemplate
                var template = current['wrap']
                    ? current['wrap']
                    : current['view']
                        ? current['property'] === true
                            ? this.relatedPropertyTemplate
                            : this.relatedTemplate
                        : current['action']
                            ? current['property'] === true
                                ? this.actionPropertyTemplate
                                : this.actionTemplate
                            : this.propertyTemplate;

                content.push(template.apply(options, this));
            }

            if (sectionStarted) content.push(this.sectionEndTemplate.apply(layoutOptions, this));

            Ext.DomHelper.append(this.contentEl, content.join(''));

            for (var i = 0; i < sectionQueue.length; i++)
            {
                var current = sectionQueue[i];

                this.processLayout(current['as'], current['options'], entry);
            }
        },
        compileLayout: function() {
            var layout = this.createLayout(),
                source = layout;
            if (source === this.layoutCompiledFrom && this.layoutCompiled)
                return this.layoutCompiled; // same layout, no changes
      
            if (this.enableCustomizations)
            {
                var customizations = App.getCustomizationsFor(this.customizationSet, this.id);
                if (customizations && customizations.length > 0)
                {
                    layout = [];
                    this.applyCustomizationsToLayout(source, customizations, layout);
                }
            }

            this.layoutCompiled = layout;
            this.layoutCompiledFrom = source;

            return layout;
        },
        applyCustomizationsToLayout: function(layout, customizations, output) {
            for (var i = 0; i < layout.length; i++)
            {
                var row = layout[i],
                    insertRowsBefore = [],
                    insertRowsAfter = [];

                for (var j = 0; j < customizations.length; j++)
                {
                    var customization = customizations[j],
                        stop = false;

                    if (customization.at(row))
                    {
                        switch (customization.type)
                        {
                            case 'remove':
                                // full stop
                                stop = true;
                                row = null;
                                break;
                            case 'replace':
                                // full stop
                                stop = true;
                                row = this.expandExpression(customization.value, row);
                                break;
                            case 'modify':
                                // make a shallow copy if we haven't already
                                if (row === layout[i])
                                    row = Ext.apply({}, row);
                                row = Ext.apply(row, this.expandExpression(customization.value, row));
                                break;
                            case 'insert':
                                (customization.where !== 'before'
                                    ? insertRowsAfter
                                    : insertRowsBefore
                                ).push(this.expandExpression(customization.value, row));
                                break;
                        }
                    }

                    if (stop) break;
                }

                output.push.apply(output, insertRowsBefore);
                if (row)
                {
                    if (row['as'])
                    {
                        // make a shallow copy if we haven't already
                        if (row === layout[i])
                            row = Ext.apply({}, row);

                        var subLayout = row['as'],
                            subLayoutOutput = (row['as'] = []);

                        this.applyCustomizationsToLayout(subLayout, customizations, subLayoutOutput);
                    }

                    output.push(row);
                }
                output.push.apply(output, insertRowsAfter);
            }
        },
        processEntry: function(entry) {
            this.entry = entry;

            if (this.entry)
            {
                this.processLayout(this.compileLayout(), {title: this.detailsText}, this.entry);
            }
        },
        onRequestDataFailure: function(response, o) {
            if (response && response.status == 404)
                Ext.DomHelper.append(this.contentEl, this.notAvailableTemplate.apply(this));
            else
                alert(String.format(this.requestErrorText, response, o));            

            this.el.removeClass('panel-loading');
        },
        onRequestDataAborted: function(response, o) {
            this.options = false; // force a refresh
            this.el.removeClass('panel-loading');
        },
        onRequestDataSuccess: function(entry) {
            this.processEntry(entry);
            this.el.removeClass('panel-loading');
        },
        requestData: function() {
            this.el.addClass('panel-loading');

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
            if (this.options)
            {
                if (options)
                {
                    if (this.options.key !== options.key) return true;
                }

                return false;
            }
            else
                return Sage.Platform.Mobile.Detail.superclass.refreshRequiredFor.call(this, options);
        },
        activate: function(tag, data) {
            var options = data && data.options;
            if (options && options.descriptor)
                options.title = options.title || options.descriptor;

            Sage.Platform.Mobile.Detail.superclass.activate.apply(this, arguments);
        },
        show: function(options) {
            // if a descriptor is specified, and no title, use the descriptor instead.
            if (options && options.descriptor)
                options.title = options.title || options.descriptor;

            Sage.Platform.Mobile.Detail.superclass.show.apply(this, arguments);
        },
        getTag: function() {
            return this.options && this.options.key;
        },
        getContext: function() {
            return Ext.apply(Sage.Platform.Mobile.Detail.superclass.getContext.call(this), {
                resourceKind: this.resourceKind,
                key: this.options.key,
                descriptor: this.options.descriptor
            });
        },
        beforeTransitionTo: function() {
            Sage.Platform.Mobile.Detail.superclass.beforeTransitionTo.call(this);

            this.canEdit = this.editor ? true : false;

            if (this.refreshRequired)
            {
                this.clear();
            }
        },
        refresh: function() {
            this.requestData();
        },
        transitionTo: function() {
            Sage.Platform.Mobile.Detail.superclass.transitionTo.call(this);
        },
        clear: function() {
            this.contentEl.update(this.emptyTemplate.apply(this));
            this.context = false;
        }
    });
})();
