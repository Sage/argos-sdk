/// <reference path="../libraries/Simplate.js"/>
/// <reference path="../libraries/reui/reui.js"/>
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-dependencies-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-debug.js"/>
/// <reference path="View.js"/>

Ext.namespace('Sage.Platform.Mobile');

Sage.Platform.Mobile.Detail = Ext.extend(Sage.Platform.Mobile.View, {
    attachmentPoints: {
        contentEl: '.panel-content'        
    },
    viewTemplate: new Simplate([            
        '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel">',
        '{%! $.loadingTemplate %}',
        '<div class="panel-content"></div>',
        '</div>'
    ]),
    emptyTemplate: new Simplate([
    ]),
    loadingTemplate: new Simplate([
        '<fieldset class="loading">',
        '<div class="row"><div class="loading-indicator">{%: $.loadingText %}</div></div>',
        '</fieldset>'
    ]),
    sectionBeginTemplate: new Simplate([
        '<h2>{%: $.title %}</h2>',
        '{% if ($.list) { %}<ul>{% } else { %}<fieldset>{% } %}'
    ]),
    sectionEndTemplate: new Simplate([
        '{% if ($.list) { %}</ul>{% } else { %}</fieldset>{% } %}'
    ]),
    propertyTemplate: new Simplate([
        '<div class="row {%= $.cls %}">',
        '<label>{%: $.label %}</label>',       
        '<span>{%= $.value %}</span>',
        '</div>'
    ]),
    relatedPropertyTemplate: new Simplate([
        '<div class="row {%= $.cls %}">',
        '<label>{%: $.label %}</label>',
        '<a data-action="activateRelatedEntry" data-view="{%= $.view %}" data-context="{%: $.context %}" data-descriptor="{%: $.descriptor %}">',
        '<span>{%= $.value %}</span>',
        '</a>',
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
            cls: 'button',
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

        return String.format(fmt, entry[property]);        
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
        return [];
    },
    processLayout: function(layout, options, entry)
    {
        var sections = [];
        var content = [];
        
        content.push(this.sectionBeginTemplate.apply(options));        

        for (var i = 0; i < layout.length; i++)
        {
            var current = layout[i];

            if (current['as'])
            {
                sections.push(current);
                continue;
            } 

            var provider = current['provider'] || Sage.Platform.Mobile.Utility.getValue;
            var value = provider(entry, current['name']);            
            
            if (current['tpl'])
            {
                var rendered = current['tpl'].apply(value);
                var formatted = current['encode'] === true
                    ? Sage.Platform.Mobile.Format.encode(rendered)
                    : rendered;
            }
            else if (current['renderer'] && typeof current['renderer'] === 'function')
            {         
                var rendered = current['renderer'].call(this, value);       
                var formatted = current['encode'] === true
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
                if (current['resourcePredicate'])
                    context['resourcePredicate'] = this.expandExpression(current['resourcePredicate'], entry);  

                options['view'] = current['view'];
                options['context'] = Ext.util.JSON.encode(context);
            }

            var template = current['wrap'] 
                ? current['wrap']
                : current['view']
                    ? current['property'] === true
                        ? this.relatedPropertyTemplate
                        : this.relatedTemplate
                    : this.propertyTemplate;
                
            content.push(template.apply(options));                          
        }

        content.push(this.sectionEndTemplate.apply(options));

        Ext.DomHelper.append(this.contentEl, content.join(''));

        for (var i = 0; i < sections.length; i++)
        {
            var current = sections[i];  
            
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
    show: function(options) {
        if (options && options.descriptor) this.setTitle(options.descriptor);
        
        Sage.Platform.Mobile.Detail.superclass.show.apply(this, arguments);
    },
    getContext: function() {
        return Ext.apply(Sage.Platform.Mobile.Detail.superclass.getContext.call(this), {
            resourceKind: this.resourceKind,
            key: this.options.key
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
