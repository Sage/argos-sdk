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
                    ? definition.message.call(definition.scope || this, value, field)
                    : String.format(definition.message, value, field);

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
    isDirty: function() {
        return (this.value != this.getValue());
    }
});

Sage.Platform.Mobile.Controls.PhoneField = Ext.extend(Sage.Platform.Mobile.Controls.TextField, {
    getValue: function() {
        return this.el.getValue().replace(/[^0-9x]/i,"");
    },
    bind: function(container) {
        Sage.Platform.Mobile.Controls.PhoneField.superclass.bind.apply(this, arguments);
        this.el.on('keyup', this.swapLettersWithKeypadNumbers, this);
        this.el.on('keypress', this.limitPhoneFieldLength, this);
    },
    limitPhoneFieldLength: function(evt, el, o) {
        //Allow the user to still delete and navigate, if the numbers are over 32 chars.
        var ALLOWED_KEYS = {
            "8"  : "BACKSPACE",
            "46" : "KEY_DELETE",
            "45" : "KEY_INSERT",
            "37" : "KEY_LEFT",
            "39" : "KEY_RIGHT"
        };
        if (typeof ALLOWED_KEYS[evt.getCharCode()] != "string" && this.el.dom.value.length > 32) {
            evt.stopEvent();
            return;
        }
    },
    swapLettersWithKeypadNumbers: function() {
        var phoneNumber = this.el.dom.value;
        // All keys are mapped to numbers except "X", which is for denoting Extn 
        var keypadLetterToNumberMap = {
            "A": 2, "B": 2, "C": 2,
            "D": 3, "E": 3, "F": 3,
            "G": 4, "H": 4, "I": 4,
            "J": 5, "K": 5, "L": 5,
            "M": 6, "N": 6, "O": 6,
            "P": 7, "Q": 7, "R": 7, "S": 7,
            "T": 8, "U": 8, "V": 8,
            "W": 9, "Y": 9, "Z": 9
        };
        //Ignore only 'x', replace other chars with numbers
        phoneNumber = phoneNumber.replace(/[a-wyz]/i, function(letter) {
            return keypadLetterToNumberMap[letter.toUpperCase()];
        });
        this.el.dom.value = phoneNumber;
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
        this.checked = val;
        this.el.dom.setAttribute('toggled', this.checked);
    },
    isDirty: function() {
        return (!!this.checked != this.getValue());
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
        '<div class="body" style="display: none;">',
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
    textFieldTemplate: new Simplate([
        '<input type="text" name="{%= name %}">'
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

        this.bodyEl = this.el.child('.body').setVisibilityMode(Ext.Element.DISPLAY);
        this.loadEl = this.el.child('.loading').setVisibilityMode(Ext.Element.DISPLAY);
    },
    init: function() {  
        Sage.Platform.Mobile.Edit.superclass.init.call(this);                

        this.processLayout(this.layout, {title: this.detailsText});

        for (var name in this.fields) this.fields[name].bind(this.el);

        this.loadEl.hide();
        this.bodyEl.show();

        // todo: find a better way to handle these notifications
        if (this.canSave) App.on('save', this.onSave, this);  
    },      
    onSave: function() {
        if (this.isActive())
            this.save();
    },
    createRequest: function() {
       
    },    
    createTemplateRequest: function() {

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
                success: function(entry) {                   
                },
                failure: function(response, o) {
                    this.requestFailure(response, o);
                },
                scope: this
            });       
    },
    show: function(o) {
        if (typeof o !== 'undefined') 
        {
            this.entry = o;
            this.newContext = true;
        }        
        else
        {
            this.newContext = false;
        }       

        Sage.Platform.Mobile.Edit.superclass.show.call(this);                     
    },  
    isNewContext: function() {
        return this.newContext;
    }, 
    beforeTransitionTo: function() {
        Sage.Platform.Mobile.Edit.superclass.beforeTransitionTo.call(this);
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
    save: function() {
        if (this.busy) 
            return;    
        
        if (this.validate() !== false) 
        {
            this.el.addClass('form-error');
            return;
        }          
        else
        {
            this.el.removeClass('form-error');
        } 

        var values = this.getValues();                        
        if (values) 
        {           
            this.busy = true;
            this.el.addClass('view-busy');
            if (App.tbar)
                App.tbar.el.addClass('toolbar-busy');

            var entry = this.createEntryForUpdate(values);

            var request = this.createRequest();            
            if (request)
                request.update(entry, {
                    success: function(modified) {  
                        this.busy = false;
                        this.el.removeClass('view-busy');
                        if (App.tbar)
                            App.tbar.el.removeClass('toolbar-busy');
                                                
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
                        this.busy = false;
                        this.el.removeClass('view-busy');
                        if (App.tbar)
                            App.tbar.el.removeClass('toolbar-busy');
                    },
                    scope: this
                });
        } 
        else
        {
            ReUI.back();
        }
    },
    transitionTo: function() {
        Sage.Platform.Mobile.Edit.superclass.transitionTo.call(this); 
        
        if (this.isNewContext())
        {
            this.setValues(this.entry);
        }       

        // todo: check to see if we are creating instead of editing and, if so, request the 'template'
        //       from SData.
    },
    clear: function() {
        // todo: add back if we are creating instead of editing.
        // this.el.update(this.contentTemplate.apply(this));
    }      
});