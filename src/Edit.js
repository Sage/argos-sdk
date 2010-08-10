/// <reference path="../ext/ext-core-debug.js"/>
/// <reference path="../Simplate.js"/>
/// <reference path="../sdata/SDataResourceCollectionRequest.js"/>
/// <reference path="../sdata/SDataService.js"/>
/// <reference path="View.js"/>

Ext.namespace('Sage.Platform.Mobile');
Ext.namespace('Sage.Platform.Mobile.Controls');

// todo: move to separate files
Sage.Platform.Mobile.Controls.Field = function(o) {
    Ext.apply(this, o, {        
    });
};

Sage.Platform.Mobile.Controls.Field.prototype = {
    selector: 'input[name="{0}"]',
    apply: function(external) {
        return this.template.apply(this);
    },
    bind: function(container) {
        this.el = container.child(String.format(this.selector, this.name));
    },       
    isDirty: function() {
        return true;
    },
    validate: function(value) {        
        if (typeof this.validator === 'undefined') 
            return false; 

        if (this.validator instanceof RegExp)                      
            var definition = {
                test: this.validator
            };
        else if (typeof this.validator === 'function')        
            var definition = {
                fn: this.validator
            };            
        else
            var definition = this.validator;
                
        var value = typeof value === 'undefined'
            ? this.getValue()
            : value;
           
        if (typeof definition.fn === 'function')      
        {  
            return definition.fn.call(definition.scope || this, value, this.editor);        
        }
        else if (definition.test instanceof RegExp)
        {  
            if (!definition.test.test(value))
            {
                var message = typeof definition.message === 'function'
                    ? definition.message.call(definition.scope || this, value)
                    : String.format(definition.message, value);

                return message || true;
            }             
        }

        return false;
    }       
};

Sage.Platform.Mobile.Controls.TextField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
    template: new Simplate([
        '<input type="text" name="{%= name %}">',
    ]),
    bind: function(container) {
        Sage.Platform.Mobile.Controls.TextField.superclass.bind.apply(this, arguments);   
        
        if (this.validInputOnly)
        {
            this.el.on('keypress', this.onKeyPress, this);
        }
        else
        {
            switch (this.validationTrigger)
            {
                case 'keyup':
                    this.el.on('keyup', this.onValidationTrigger, this);
                    break;
                case 'blur':
                    this.el.on('blur', this.onValidationTrigger, this);
                    break;
            }
        }
    },
    onKeyPress: function(evt, el, o) {
        if (this.validInputOnly)
        {
            var v = this.getValue() + String.fromCharCode(evt.getCharCode());
            if (this.validate(v))
            {
                evt.stopEvent();
                return;
            }     
        }
    },
    onValidationTrigger: function(evt, el, o) {
        if (this.validate())
            this.el.addClass('field-error');
        else
            this.el.removeClass('field-error');
    },    
    getValue: function() {
        return this.el.getValue();
    },
    setValue: function(val) {
        this.value = val;

        this.el.dom.value = val;
    },
    clearValue: function() {
        this.setValue('');
    },
    isDirty: function() {
        return (this.value != this.getValue());
    }
});

Sage.Platform.Mobile.Controls.PhoneField = Ext.extend(Sage.Platform.Mobile.Controls.TextField, {
    template: new Simplate([
        '<input type="text" name="{%= name %}">',
    ]),
    /*
        {0}: original value
        {1}: cleaned value
        {2}: entire match (against clean value)
        {3..n}: match groups (against clean value)
    */
    formatters: [{
        test: /^\+.*/,
        format: '{0}'
    },{
        test: /^(\d{3})(\d{3,4})$/,
        format: '{3}-{4}'
    },{
        test: /^(\d{3})(\d{3})(\d{2,})(.*)$/,
        format: '({3})-{4}-{5}{6}'
    }],
    getValue: function() {
        var value = this.el.getValue();
        
        if (/^\+/.test(value)) return value; 

        return value.replace(/[^0-9x]/ig, "");
    },        
    setValue: function(val) {
        this.value = val;

        this.el.dom.value = this.formatNumberForDisplay(val);
    },    
    formatNumberForDisplay: function(number, clean) {
        if (typeof clean === 'undefined')
            var clean = number;
      
        for (var i = 0; i < this.formatters.length; i++)
        {
            var formatter = this.formatters[i];
            var match;       
            if ((match = formatter.test.exec(clean)))
                return String.format.apply(String, [formatter.format, number, clean].concat(match));
        }

        return number;
    },    
    bind: function(container) {
        Sage.Platform.Mobile.Controls.TextField.superclass.bind.apply(this, arguments);

        this.el.on('keyup', this.onKeyUp, this);
    },
    onKeyUp: function(evt, el, o) {
        this.el.dom.value = this.formatNumberForDisplay(this.el.dom.value, this.getValue());
    }
});

Sage.Platform.Mobile.Controls.BooleanField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
    selector: 'div[name="{0}"]',
    template: new Simplate([
        '<div name="{%= name %}" class="toggle" toggled="{%= !!$.checked %}">',
        '<span class="thumb"></span>',
        '<span class="toggleOn">{%= $.onText %}</span>',
        '<span class="toggleOff">{%= $.offText %}</span>',
        '</div>'
    ]),
    onText: 'ON',
    offText: 'OFF',
    constructor: function(o) {        
        Sage.Platform.Mobile.Controls.BooleanField.superclass.constructor.apply(this, arguments);             
    },
    bind: function(container) {
        Sage.Platform.Mobile.Controls.BooleanField.superclass.bind.apply(this, arguments);        

        this.el.on('click', this.onClick, this, {stopEvent: true});
    },
    onClick: function(evt, el, o) {
        this.el.dom.setAttribute('toggled', this.el.getAttribute('toggled') !== 'true');
    },
    getValue: function() {
        return this.el.getAttribute('toggled') === 'true';
    },
    setValue: function(val) {
        this.value = val;
        this.el.dom.setAttribute('toggled', this.checked);
    },
    clearValue: function() {
        this.setValue(!!this.checked);
    },
    isDirty: function() {
        return (this.value != this.getValue());
    }
});

Sage.Platform.Mobile.Controls.registered = {
    'text': Sage.Platform.Mobile.Controls.TextField,
    'phone': Sage.Platform.Mobile.Controls.PhoneField,
    'boolean': Sage.Platform.Mobile.Controls.BooleanField
};

Sage.Platform.Mobile.Edit = Ext.extend(Sage.Platform.Mobile.View, {   
    viewTemplate: new Simplate([            
        '<div id="{%= id %}" title="{%= title %}" class="panel" effect="flip">',  
        '<fieldset class="loading">',
        '<div class="row"><div class="loading-indicator">{%= loadingText %}</div></div>',
        '</fieldset>',
        '</div>',           
        '</div>'
    ]),       
    sectionBeginTemplate: new Simplate([
        '<h2>{%= $["title"] %}</h2>',
        '{% if ($["list"]) { %}<ul>{% } else { %}<fieldset>{% } %}'
    ]),
    sectionEndTemplate: new Simplate([
        '{% if ($["list"]) { %}</ul>{% } else { %}</fieldset>{% } %}'
    ]),
    propertyTemplate: new Simplate([
        '<div class="row row-edit">',
        '<label>{%= label %}</label>',       
        '{%! field %}', /* apply sub-template */
        '</div>'
    ]),    
    saveText: 'Save',
    titleText: 'Edit',
    detailsText: 'Details',    
    loadingText: 'loading...',
    constructor: function(o) {
        Sage.Platform.Mobile.Edit.superclass.constructor.call(this);        
        
        Ext.apply(this, o, {
            id: 'generic_edit',
            title: this.titleText,
            expose: false,
            tools: {
                tbar: [{
                    name: 'edit',
                    title: this.saveText,                                                              
                    cls: 'button blueButton',                 
                    fn: this.save,
                    scope: this                
                }]
            },
            fields: {}          
        });
    },
    render: function() {
        Sage.Platform.Mobile.Edit.superclass.render.call(this);               
    },
    init: function() {  
        Sage.Platform.Mobile.Edit.superclass.init.call(this);                

        this.processLayout(this.layout, {title: this.detailsText});

        for (var name in this.fields) this.fields[name].bind(this.el);
    },          
    createRequest: function() {
        var request = new Sage.SData.Client.SDataSingleResourceRequest(this.getService());

        if (this.entry && this.entry['$key'])
            request.setResourceSelector(String.format("'{0}'", this.entry['$key']));

        return request;
    },    
    createTemplateRequest: function() {
        var request = new Sage.SData.Client.SDataTemplateResourceRequest(this.getService());       

        if (this.resourceKind) 
            request.setResourceKind(this.resourceKind);

        return request;
    },
    processLayout: function(layout, options)
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
            else
            {   
                var ctor = Sage.Platform.Mobile.Controls.registered[current['type']];
                var field = this.fields[current['name']] = new ctor(Ext.apply({
                    editor: this
                }, current));

                content.push(this.propertyTemplate.apply({
                    label: current['label'],
                    field: field
                }));
            }
        }

        content.push(this.sectionEndTemplate.apply(options));

        Ext.DomHelper.append(this.el, content.join(''));

        for (var i = 0; i < sections.length; i++)
        {
            var current = sections[i];  
            
            this.processLayout(current['as'], current['options']);  
        }        
    },    
    requestFailure: function(response, o) {
       
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
    requestTemplateFailure: function() {

    },
    requestTemplateData: function() {
        var request = this.createTemplateRequest();
        if (request)
            request.read({
                success: this.processTemplateEntry,
                failure: this.requestTemplateFailure,
                scope: this
            });
    },
    processEntry: function(entry) {
        // not currently used
    },
    processTemplateEntry: function(entry) {
        this.setValues(entry || {});
        this.el.removeClass('panel-loading');
    },
    show: function(o) {        
        if (o) 
        {
            this.newContext = o;
        }          

        Sage.Platform.Mobile.Edit.superclass.show.call(this);                     
    },  
    isNewContext: function() {
        return this.newContext;
    },    
    clearValues: function() {
        for (var name in this.fields)
        {
            this.fields[name].clearValue();
        }
    },
    setValues: function(o) {
        for (var name in this.fields)
        {
            var value = Sage.Platform.Mobile.Utility.getValue(o, name);

            this.fields[name].setValue(value);
        }
    },
    getValues: function() {
        var o = {};
        var empty = true;

        for (var name in this.fields)
        {                        
            if (this.fields[name].isDirty())
            {
                var value = this.fields[name].getValue();
                
                Sage.Platform.Mobile.Utility.setValue(o, name, value);

                empty = false;
            }
        }
        return empty ? false : o;
    },
    validate: function() {
        this.errors = [];

        for (var name in this.fields)
        {
            var result;
            if (false !== (result = this.fields[name].validate()))
            {
                this.fields[name].el.addClass('field-error');

                this.errors.push({
                    name: name,
                    message: result
                });                
            }
            else
            {
                this.fields[name].el.removeClass('field-error');
            }
        }

        return this.errors.length > 0
            ? this.errors
            : false;
    },
    createEntryForUpdate: function(values) {
        return Ext.apply(values, {
            '$key': this.entry['$key'],
            '$etag': this.entry['$etag'],
            '$name': this.entry['$name']           
        });
    },
    createEntryForInsert: function(values) {
        return Ext.apply(values, {
            '$name': this.entityName
        });
    },
    isFormDisabled: function() {
        return this.busy;
    },
    disableForm: function() {
        this.busy = true;
        this.el.addClass('view-busy');
        if (App.bars.tbar && App.bars.tbar.el)
            App.bars.tbar.el.addClass('toolbar-busy');
    },
    enableForm: function() {
        this.busy = false;
        this.el.removeClass('view-busy');
        if (App.bars.tbar && App.bars.tbar.el)
            App.bars.tbar.el.removeClass('toolbar-busy');
    },
    insert: function() {
        this.disableForm();

        var values = this.getValues();         
        if (values) 
        {
            var entry = this.createEntryForInsert(values);

            var request = this.createRequest();            
            if (request)
                request.create(entry, {
                    success: function(created) {  
                        this.enableForm()
                                                
                        App.fireEvent('refresh', {
                            resourceKind: this.resourceKind                            
                        });
                            
                        ReUI.back();
                    },
                    failure: function(response, o) {
                        this.enableForm();
                    },
                    scope: this
                });
        }
        else
        {
            ReUI.back();
        }
    },
    update: function() {
        var values = this.getValues();                        
        if (values) 
        {           
            this.disableForm();

            var entry = this.createEntryForUpdate(values);

            var request = this.createRequest();            
            if (request)
                request.update(entry, {
                    success: function(modified) {  
                        this.enableForm()
                                                
                        App.fireEvent('refresh', {
                            resourceKind: this.resourceKind,
                            key: modified['$key'],
                            data: {
                                '$descriptor': modified['$descriptor']
                            }
                        });
                            
                        ReUI.back();
                    },
                    failure: function(response, o) {
                        this.enableForm();
                    },
                    scope: this
                });
        } 
        else
        {
            ReUI.back();
        }
    },
    save: function() {
        if (this.isFormDisabled())  return;    
        
        if (this.validate() !== false) 
        {
            this.el.addClass('form-error');
            return;
        }          
        else
        {
            this.el.removeClass('form-error');
        }        
        
        if (this.inserting)
            this.insert();
        else
            this.update();         
    },
    beforeTransitionTo: function() {
        Sage.Platform.Mobile.Edit.superclass.beforeTransitionTo.call(this);
        
        if (this.isNewContext())
        {
            if (this.newContext.insert === true)
                this.el.addClass('panel-loading');
            else
                this.el.removeClass('panel-loading');
        } 
    },
    transitionTo: function() {
        Sage.Platform.Mobile.Edit.superclass.transitionTo.call(this); 
        
        if (this.isNewContext())
        {
            this.context = this.newContext;
            this.newContext = false;

            this.entry = false;            
            this.inserting = (this.context.insert === true);

            this.clearValues();

            if (this.inserting)
            {
                this.requestTemplateData();
            }
            else            
            {
                this.entry = this.context.entry;                 
                this.setValues(this.context.entry || {});
            }            
        }       
    }      
});