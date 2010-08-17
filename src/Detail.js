/// <reference path="../ext/ext-core-debug.js"/>
/// <reference path="../Simplate.js"/>
/// <reference path="../sdata/SDataResourceCollectionRequest.js"/>
/// <reference path="../sdata/SDataService.js"/>
/// <reference path="View.js"/>

Ext.namespace('Sage.Platform.Mobile');

Sage.Platform.Mobile.Detail = Ext.extend(Sage.Platform.Mobile.View, {   
    viewTemplate: new Simplate([            
        '<div id="{%= id %}" title="{%= title %}" class="panel">',             
        '</div>'
    ]),
    loadingTemplate: new Simplate([
        '<fieldset class="loading">',
        '<div class="row"><div class="loading-indicator">{%= loadingText %}</div></div>',
        '</fieldset>',
    ]),
    sectionBeginTemplate: new Simplate([
        '<h2>{%= $["title"] %}</h2>',
        '{% if ($["list"]) { %}<ul>{% } else { %}<fieldset>{% } %}'
    ]),
    sectionEndTemplate: new Simplate([
        '{% if ($["list"]) { %}</ul>{% } else { %}</fieldset>{% } %}'
    ]),
    propertyTemplate: new Simplate([
        '<div class="row {%= $["cls"] %}">',
        '<label>{%= $["label"] %}</label>',       
        '<span>{%= $["value"] %}</span>',
        '</div>'
    ]),
    relatedPropertyTemplate: new Simplate([
        '<div class="row {%= $["cls"] %}">',
        '<label>{%= $["label"] %}</label>',       
        '<a href="#{%= $["view"] %}" target="_related" m:context="{%: $["context"] %}" {% if ($["descriptor"]) { %}m:descriptor="{%: $["descriptor"] %}"{% } %}>{%= $["value"] %}</a>',
        '</div>'
    ]),
    relatedTemplate: new Simplate([
        '<li class="{%= $["cls"] %}">',
        '<a href="#{%= $["view"] %}" target="_related" m:context="{%: $["context"] %}">', 
        '{% if ($["icon"]) { %}',
        '<img src="{%= $["icon"] %}" alt="icon" class="icon" />',
        '{% } %}',
        '{%= $["label"] %}',
        '</a>',
        '</li>'
    ]),    
    editText: 'Edit',
    titleText: 'Detail',
    detailsText: 'Details',
    loadingText: 'loading...',
    constructor: function(o) {
        Sage.Platform.Mobile.Detail.superclass.constructor.call(this);        
        
        Ext.apply(this, o, {
            id: 'generic_detail',
            title: this.titleText,
            expose: false,
            editor: false,
            tools: {
                tbar: [{
                    name: 'edit',
                    title: this.editText,
                    hidden: function() { return !this.editor; },                                                                
                    cls: 'button blueButton',                 
                    fn: this.navigateToEdit,
                    scope: this                
                }]
            }        
        });        
    },
    render: function() {
        Sage.Platform.Mobile.Detail.superclass.render.call(this);

        this.clear();
    },
    init: function() {  
        Sage.Platform.Mobile.Detail.superclass.init.call(this);
        
        this.el.on('click', this.onClick, this);
        
        // todo: find a better way to handle these notifications
        App.on('refresh', this.onRefresh, this);  
    },
    onRefresh: function(o) {
        if (this.options && this.options.key === o.key)
        {
            this.refreshRequired = true;

            if (o.data && o.data['$descriptor'])
                this.setTitle(o.data['$descriptor']);
        }
    },
    onClick: function(evt, el, o) {
        var el = Ext.get(el);

        var link = el;
        if (link.is('a[target="_related"]') || (link = link.up('a[target="_related"]')))
        {
            evt.stopEvent();

            var view = link.dom.hash.substring(1);

            var value = link.getAttribute('key', 'm') || Ext.util.JSON.decode(link.getAttribute('context', 'm'));
            var descriptor = link.getAttribute('descriptor', 'm');
        
            this.navigateToRelated(view, value, descriptor);   
            return;
        }  
    },
    formatRelatedQuery: function(entry, fmt, property) {
        var property = property || '$key';

        return String.format(fmt, entry[property]);        
    },
    navigateToEdit: function() {
        var view = App.getView(this.editor);
        if (view)
            view.show({entry: this.entry});
    },
    navigateToRelated: function(view, o, descriptor) {    
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
    processLayout: function(layout, options, entry, el)
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

        Ext.DomHelper.append(el || this.el, content.join(''));

        for (var i = 0; i < sections.length; i++)
        {
            var current = sections[i];  
            
            this.processLayout(current['as'], current['options'], entry, el);  
        }        
    },    
    requestFailure: function(response, o) {
       
    },
    processEntry: function(entry) {
        this.entry = entry;
                
        if (this.entry)         
        {               
            this.processLayout(this.layout, {title: this.detailsText}, this.entry);
        }

        this.el.removeClass('panel-loading');  
    },
    requestData: function() {
        var request = this.createRequest();
        if (request)
            request.read({
                success: this.processEntry,
                failure: this.requestFailure,
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
            return true;
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
        this.el.addClass('panel-loading');
        this.el.update(this.loadingTemplate.apply(this));
        this.context = false;
    }      
});