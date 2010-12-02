/// <reference path="../libraries/Simplate.js"/>
/// <reference path="../libraries/reui/reui.js"/>
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-dependencies-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-debug.js"/>
/// <reference path="View.js"/>

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
            '<fieldset class="panel-loading-indicator">',
            '<div class="row"><div>{%: $.loadingText %}</div></div>',
            '</fieldset>'
        ]),     
        sectionBeginTemplate: new Simplate([
            '<h2 data-action="toggleSection" class="{% if ($.collapsed) { %}collapsed{% } %}">{%: $.title %}<span class="collapsed-indicator"></span></h2>',
            '{% if ($.list) { %}<ul class="{%= $.cls %}">{% } else { %}<fieldset class="{%= $.cls %}">{% } %}'
        ]),
        sectionEndTemplate: new Simplate([
            '{% if ($.list) { %}</ul>{% } else { %}</fieldset>{% } %}'
        ]),
        propertyTemplate: new Simplate([
            '<div class="row {%= $.cls %}" data-property="{%= $.name %}">',
            '<label>{%: $.label %}</label>',
            '<span>{%= $.value %}</span>',
            '</div>'
        ]),
        relatedPropertyTemplate: new Simplate([
            '<div class="row {%= $.cls %}">',
            '<label>{%: $.label %}</label>',
            '<span>',
            '<a data-action="activateRelatedEntry" data-view="{%= $.view %}" data-context="{%: $.context %}" data-descriptor="{%: $.descriptor %}" href="#">',
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
            '<a data-action="{%= $.action %}">',
            '{%= $.value %}',
            '</a>',
            '</span>',
            '</div>'
        ]),
        actionTemplate: new Simplate([
            '<li class="{%= $.cls %}">',
            '<a data-action="{%= $.action %}">',
            '{% if ($.icon) { %}',
            '<img src="{%= $.icon %}" alt="icon" class="icon" />',
            '{% } %}',
            '<label>{%: $.label %}</label>',
            '<span>{%= $.value %}</span>',
            '</a>',
            '</li>'
        ]),
        id: 'generic_detail',
        expose: false,
        editText: 'Edit',
        titleText: 'Detail',
        detailsText: 'Details',
        loadingText: 'loading...',
        requestErrorText: 'A server error occured while requesting data.',
        editView: false,
        init: function() {
            Sage.Platform.Mobile.Detail.superclass.init.call(this);

            App.on('refresh', this.onRefresh, this);

            this.tools.tbar = [{
                name: 'edit',
                title: this.editText,
                hidden: function() { return !this.editView; },
                fn: this.navigateToEditView,
                scope: this
            }];

            this.clear();
        },
        onRefresh: function(o) {
            if (this.options && this.options.key === o.key)
            {
                this.refreshRequired = true;

                if (o.data && o.data['$descriptor'])
                    this.setTitle(o.data['$descriptor']);
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

                if (current['tpl'])
                {
                    var rendered = current['tpl'].apply(value, this),
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

                var options = {
                    cls: current['cls'],
                    icon: current['icon'],
                    name: current['name'],
                    label: current['label'],
                    entry: entry,
                    value: formatted,
                    raw: value
                };

                if (current['descriptor'])
                    options['descriptor'] = typeof current['descriptor'] === 'function'
                        ? this.expandExpression(current['descriptor'], entry)
                        : provider(entry, current['descriptor']);

                if (current['action'])
                    options['action'] = this.expandExpression(current['action'], entry);

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
        requestFailure: function(response, o) {
            alert(String.format(this.requestErrorText, response, o));
        },
        processEntry: function(entry) {
            this.entry = entry;

            if (this.entry)
                this.processLayout(this.createLayout(), {title: this.detailsText}, this.entry);
        },
        requestData: function() {
            this.el.addClass('panel-loading');

            var request = this.createRequest();
            if (request)
                request.read({
                    success: function(entry) {
                        this.processEntry(entry);
                        this.el.removeClass('panel-loading');
                    },
                    failure: function(response, o) {
                        this.requestFailure(response, o);
                        this.el.removeClass('panel-loading');
                    },
                    aborted: function(response, o) {
                        this.options = false; // force a refresh
                        this.el.removeClass('panel-loading');
                    },
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
            if (data && data.options && data.options.descriptor) this.setTitle(data.options.descriptor);

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
