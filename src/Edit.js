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
        '<input type="text" name="{%= name %}" class="field-text" {% if ($.readonly) { %} readonly {% } %}>',
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

Sage.Platform.Mobile.Controls.HiddenField = Ext.extend(Sage.Platform.Mobile.Controls.TextField, {
    template: new Simplate([
        '<input type="hidden" class="field-text" name="{%= name %}">',
    ]),
    bind: function() {
        //Call Field's bind. We don't want event handlers for this. 
        Sage.Platform.Mobile.Controls.Field.prototype.bind.apply(this, arguments);
    },
    //Always return true, so that hidden value is passed always.
    isDirty: function() {
        return true;
    }
});

Sage.Platform.Mobile.Controls.PhoneField = Ext.extend(Sage.Platform.Mobile.Controls.TextField, {
    template: new Simplate([
        '<input type="text" name="{%= name %}" class="field-phone">',
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
        '<div name="{%= name %}" class="field-boolean toggle" toggled="{%= !!$.checked %}">',
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
        if (val == "true") val = true;
        if (val == "false") val = false;

        this.value = !!val;
        var checked = this.value ? 'true' : 'false';
        this.el.dom.setAttribute('toggled', checked);
    },
    clearValue: function() {
        this.setValue(!!this.checked);
    },
    isDirty: function() {
        return (this.value != this.getValue());
    }
});

Sage.Platform.Mobile.Controls.LookupField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
    selector: 'div[name="{0}"]',
    template: new Simplate([
        '<div name="{%= name %}" class="field-lookup">',
        '<a href="#{%= view %}"><span></span></a>',
        '</div>'
    ]),
    emptyText: 'empty',
    keyProperty: '$key',
    textProperty: '$descriptor',
    bind: function(container) {
        Sage.Platform.Mobile.Controls.LookupField.superclass.bind.apply(this, arguments);

        this.el.on('click', this.onClick, this, {stopEvent: true});
    },
    getViewOptions: function() {
        var options = {
            selectionOnly: true,
            singleSelect: true,
            tools: {
                tbar: [{
                    name: 'select',
                    title: 'Select',
                    cls: 'button',
                    fn: this.select,
                    scope: this
                }]
            }
        };
        if (this.where) options.where = this.where;
        //If its a function, pass the editor along
        if (this.where && typeof this.where == 'function')
        {
            options.where = this.where(this.editor);
        }
        //TODO: Need to find a way to figure out a Simplate Object
        //If its a simplate, we will evaluate it with current entry.
        else if (this.where && typeof this.where == 'object' && this.where.apply) 
        {
            options.where = this.where.apply(this.editor.entry);
        }

        return options;
    },
    onClick: function(evt, el, o) {
        // todo: limit the clicks to a specific element?
        var el = Ext.get(el);

        var link = el;
        if (link.is('a') || (link = link.up('a')))
        {
            evt.stopEvent();

            var id = link.dom.hash.substring(1),
                view = App.getView(id);
            if (view)
            {
                if (this.title) view.setTitle(this.title);
                view.show(this.getViewOptions());
            }
            return;
        }
    },
    select: function() {
        // todo: should there be a better way?
        var view = App.getActiveView();
        if (view && view.selectionModel)
        {
            var selections = view.selectionModel.getSelections();

            for (var key in selections)
            {
                var val = selections[key].data,
                    text = this.extractText(val, key);

                this.selected = {
                    key: key,
                    text: text
                };

                this.el.select('a > span').item(0).dom.innerHTML = text; // todo: temporary
                break;
            }
            ReUI.back();
        }
    },
    isDirty: function() {
        if (!this.value && this.selected) return true;

        if (this.value && this.selected) return this.value.key !== this.selected.key;

        return false;
    },
    getValue: function() {
        if (this.keyProperty)
        {
            var value = {};
            Sage.Platform.Mobile.Utility.setValue(value, this.keyProperty, this.selected.key);
        }
        else
        {
            var value = this.selected.key;
        }
        return value;
    },
    extractKey: function(val) {
        return this.keyProperty
            ? Sage.Platform.Mobile.Utility.getValue(val, this.keyProperty)
            : val;
    },
    extractText: function(val, key) {
        var key = key || this.extractKey(val), textValue,
            text = this.textProperty
                ? Sage.Platform.Mobile.Utility.getValue(val, this.textProperty)
                : key;

        textValue = this.textProperty ? text : val;
        if (this.textTemplate && textValue)
            text = this.textTemplate.apply(textValue);

        return (text || this.emptyText);
    },
    setValue: function(val) {
        if (val)
        {
            var key = this.extractKey(val),
                text = this.extractText(val, key);

            this.value = this.selected = {
                key: key,
                text: text
            };
        }
        else
        {
            this.value = this.selected = false;
            var text = this.emptyText;
        }

        this.el.select('a > span').item(0).dom.innerHTML = text; // todo: temporary
    },
    clearValue: function() {
        this.setValue(false);
    }
});

Sage.Platform.Mobile.Controls.SelectField = Ext.extend(Sage.Platform.Mobile.Controls.LookupField, {
    getViewOptions: function() {
        var options = Sage.Platform.Mobile.Controls.SelectField.superclass.getViewOptions.call(this);

        options.list = this.list;
        return options;
    },
    setValue: function(val) {
        // todo: must revisit. This is not the right way to do.
        if (typeof val == "string") {
            //Loop through the given list to find a value.
            var selectedVal;
            for (var i = 0, len = this.list.length; i < len; i++)
            {
                if (this.list[i][this.keyProperty] == val)
                {
                    selectedVal= this.list[i];
                    break;
                }
            }
            if (selectedVal)
            {
                this.value = this.selected = {
                    key: selectedVal[this.keyProperty],
                    text: selectedVal[this.textProperty]
                };
                this.el.select('a > span').item(0).dom.innerHTML = selectedVal[this.textProperty];
                return;
            }
        }
        Sage.Platform.Mobile.Controls.SelectField.superclass.setValue.call(this, val);
    },
    getValue: function() {
        var value = Sage.Platform.Mobile.Controls.SelectField.superclass.getValue.call(this);
        if (value && value[this.keyProperty])
        {
            return value[this.keyProperty];
        }
        return value;
    }
});

Sage.Platform.Mobile.Controls.PickupField = Ext.extend(Sage.Platform.Mobile.Controls.LookupField, {
    keyProperty: false,
    textProperty: false,
    getViewOptions: function() {
        var parentValue, parentValueObj,
            parentField, resPredicate = this.resourcePredicate,
            options = Sage.Platform.Mobile.Controls.PickupField.superclass.getViewOptions.call(this);

        options.resourceProperty = 'items';

        if (this.dependsOn)
        {
            parentField = this.editor.fields[this.dependsOn];
            parentValue = parentField.getValue();

            if (!parentValue)
            {
                if (this.errMsg) alert(this.errMsg);
                return;
            }

            if (typeof this.resourcePredicate == "function")
            {
                resPredicate = this.resourcePredicate.call(this.editor, parentValue);
            }
            else if (typeof this.resourcePredicate != "string")
            {
                parentValueObj = {};
                parentValueObj[this.dependsOn] = parentValue;
                resPredicate = this.resourcePredicate.apply(parentValueObj);
            }
        }

        if (resPredicate)
        {
            options['resourcePredicate'] = resPredicate;
        }

        if (this.orderBy)
        {
            options['orderBy'] = this.orderBy;
        }

        return options;
    },
    setValue: function(val) {
        // todo: must revisit. This is not the right way to do.
        if (typeof val == "string") {
            this.value = this.selected = {
                key: val,
                text: val
            };
            this.el.select('a > span').item(0).dom.innerHTML = val;
            return;
        }
        else if (val === null) {
            val = false;
        }
        Sage.Platform.Mobile.Controls.PickupField.superclass.setValue.call(this, val);
    },
    select: function() {
        if (this.keyProperty)
        {
            Sage.Platform.Mobile.Controls.PickupField.superclass.select.call(this);
            return;
        }

        var view = App.getActiveView();
        if (view && view.selectionModel)
        {
            var selections = view.selectionModel.getSelections();

            for (var key in selections)
            {
                var val = selections[key].data.text;
                this.selected = {
                    key: val,
                    text: val
                };

                this.el.select('a > span').item(0).dom.innerHTML = val; // todo: temporary
                break;
            }

            ReUI.back();
        }
    }
});

Sage.Platform.Mobile.Controls.AddressField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
    selector: 'div[name="{0}"]',
    template: new Simplate([
        '<div name="{%= name %}" class="field-address">',
        '<a href="#{%= view %}"><span></span></a>',
        '</div>'
    ]),
    emptyText: 'empty',
    bind: function(container) {
        Sage.Platform.Mobile.Controls.AddressField.superclass.bind.apply(this, arguments);

        this.el.on('click', this.onClick, this, {stopEvent: true});
    },
    onClick: function(evt, el, o) {
        // todo: limit the clicks to a specific element?
        var el = Ext.get(el), entry;

        var link = el;
        if (link.is('a') || (link = link.up('a')))
        {
            evt.stopEvent();

            var id = link.dom.hash.substring(1),
                view = App.getView(id);
            if (view)
            {
                if (this.value)
                {
                    entry = {};
                    entry[this.name] = this.value;
                }
                else
                {
                    entry = this.editor.entry;
                }
                view.setTitle(this.title);
                view.show({
                    tools: {
                        tbar: [{
                            name: 'done',
                            title: 'Done',
                            cls: 'button blueButton',
                            fn: this.done,
                            scope: this
                        }]
                    },
                    'entry': entry
                });
            }
        }
    },
    done: function() {
        var view = App.getActiveView(),
            text = '';

        if (view)
        {
            this.finalValue = view.getValues();
        }

        if (this.finalValue)
        {
            Ext.apply(this.value, this.finalValue[this.name]); 
            text = this.renderer(this.value);
            this.el.select('a > span').item(0).dom.innerHTML = text;
        }
        ReUI.back();
    },
    //TODO: Must not return true for preset values.
    isDirty: function() {
        return this.getValue() !== false;
    },
    getValue: function() {
        if (this.finalValue && this.finalValue[this.name]) return this.finalValue[this.name];
        if (this.value && this.value["$resources"]) return false;
        if (this.value) return this.value;
        return false;
    },
    setValue: function(val) {
        var text = '';
        if (val)
        {
            this.value = Ext.decode(Ext.encode(val));
            text = this.renderer(this.value);
        }
        else
        {
            this.value = this.finalValue = false;
            text = this.emptyText;
        }

        this.el.select('a > span').item(0).dom.innerHTML = text; // todo: temporary
    },
    clearValue: function() {
        this.setValue({});
    }
 });

Sage.Platform.Mobile.Controls.registered = {
    'text': Sage.Platform.Mobile.Controls.TextField,
    'hidden': Sage.Platform.Mobile.Controls.HiddenField,
    'phone': Sage.Platform.Mobile.Controls.PhoneField,
    'boolean': Sage.Platform.Mobile.Controls.BooleanField,
    'lookup': Sage.Platform.Mobile.Controls.LookupField,
    'pickup': Sage.Platform.Mobile.Controls.PickupField,
    'select': Sage.Platform.Mobile.Controls.SelectField,
    'address': Sage.Platform.Mobile.Controls.AddressField
};

Sage.Platform.Mobile.Edit = Ext.extend(Sage.Platform.Mobile.View, {
    viewTemplate: new Simplate([
        '<div id="{%= id %}" title="{%= title %}" class="panel" effect="flip">',
        '<fieldset class="loading">',
        '<div class="row"><div class="loading-indicator">{%= loadingText %}</div></div>',
        '</fieldset>',
        '<div class="panel-content"></div>',
        '</div>'
    ]),
    sectionBeginTemplate: new Simplate([
        '<h2>{%= $.title %}</h2>',
        '{% if ($.list) { %}<ul>{% } else { %}<fieldset>{% } %}'
    ]),
    sectionEndTemplate: new Simplate([
        '{% if ($.list) { %}</ul>{% } else { %}</fieldset>{% } %}'
    ]),
    propertyTemplate: new Simplate([
        '<div class="row row-edit">',
        '<label>{%= $.label %}</label>',
        '{%! $.field %}', /* apply sub-template */
        '</div>'
    ]),
    hiddenPropertyTemplate: new Simplate([
        '{%! $.field %}' /* apply sub-template */
    ]),
    saveText: 'Save',
    titleText: 'Edit',
    detailsText: 'Details',
    loadingText: 'loading...',
    placeContentAt: '.panel-content',
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
                    cls: 'button',
                    fn: this.save,
                    scope: this
                }]
            },
            fields: {}
        });
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

                if (current['type'] == 'hidden')
                {
                    content.push(this.hiddenPropertyTemplate.apply({
                        field: field
                    }));
                }
                else
                {
                    content.push(this.propertyTemplate.apply({
                        label: current['label'],
                        field: field
                    }));
                }
            }
        }

        content.push(this.sectionEndTemplate.apply(options));

        Ext.DomHelper.append(this.el.child(this.placeContentAt) || this.el, content.join(''));

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
            if (this.fields[name].forceValue === true || this.fields[name].isDirty())
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
                        this.enableForm();

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
                        this.enableForm();

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
    getContext: function() {
        return Ext.apply(Sage.Platform.Mobile.Edit.superclass.getContext.call(this), {
            resourceKind: this.resourceKind,
            insert: this.options.insert,
            key: this.options.insert ? false : this.options.entry['$key']
        });
    },
    beforeTransitionTo: function() {
        Sage.Platform.Mobile.Edit.superclass.beforeTransitionTo.call(this);

        if (this.refreshRequired)
        {
            if (this.options.insert === true)
                this.el.addClass('panel-loading');
            else
                this.el.removeClass('panel-loading');
        }
    },
    refresh: function() {
        this.entry = false;
        this.inserting = (this.options.insert === true);

        this.clearValues();

        if (this.inserting)
        {
            this.requestTemplateData();
        }
        else
        {
            this.entry = this.options.entry;
            this.setValues(this.options.entry || {});
        }
    },
    transitionTo: function() {
        Sage.Platform.Mobile.Edit.superclass.transitionTo.call(this);
    }
});
