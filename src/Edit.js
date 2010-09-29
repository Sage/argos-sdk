/// <reference path="../libraries/Simplate.js"/>
/// <reference path="../libraries/reui/reui.js"/>
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-dependencies-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-debug.js"/>
/// <reference path="View.js"/>

Ext.namespace('Sage.Platform.Mobile');
Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Edit = Ext.extend(Sage.Platform.Mobile.View, {
        attachmentPoints: {
            contentEl: '.panel-content',
            validationContentEl: '.panel-validation-summary > ul'
        },
        viewTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel" effect="{%= $.transitionEffect %}">',
            '{%! $.loadingTemplate %}',
            '{%! $.validationSummaryTemplate %}',
            '<div class="panel-content"></div>',
            '</div>'
        ]),
        loadingTemplate: new Simplate([
            '<fieldset class="panel-loading-indicator">',
            '<div class="row"><div>{%: $.loadingText %}</div></div>',
            '</fieldset>'        
        ]),
        validationSummaryTemplate: new Simplate([
            '<div class="panel-validation-summary">',
            '<h2>{%: $.validationSummaryText %}</h2>',
            '<ul>',
            '</ul>',
            '</div>'
        ]),
        validationSummaryItemTemplate: new Simplate([
            '<li>',
            '<a href="#{%= $.name %}">',
            '<h3>{%: $.message %}</h3>',
            '<h4>{%: $$.label %}</h4>',
            '</a>',
            '</li>'
        ]),
        sectionBeginTemplate: new Simplate([
            '<h2>{%: $.title %}</h2>',
            '{% if ($.list) { %}<ul>{% } else { %}<fieldset>{% } %}'
        ]),
        sectionEndTemplate: new Simplate([
            '{% if ($.list) { %}</ul>{% } else { %}</fieldset>{% } %}'
        ]),
        propertyTemplate: new Simplate([
            '<div class="row row-edit">',
            '<a name="{%: $.field.name %}"></a>',
            '<label>{%: $.label %}</label>',
            '{%! $.field %}', /* apply sub-template */
            '</div>'
        ]),
        transitionEffect: 'flip',
        id: 'generic_edit',
        expose: false,
        saveText: 'Save',
        titleText: 'Edit',
        validationSummaryText: 'Validation Summary',
        detailsText: 'Details',
        loadingText: 'loading...',
        constructor: function(o) {
            Sage.Platform.Mobile.Edit.superclass.constructor.apply(this, arguments);

            this.fields = {};
        },
        init: function() {
            Sage.Platform.Mobile.Edit.superclass.init.call(this);

            this.processLayout(this.createLayout(), {title: this.detailsText});

            for (var name in this.fields) this.fields[name].bind(this.el);

            this.tools.tbar = [{
                name: 'save',
                title: this.saveText,
                cls: 'button',
                fn: this.save,
                scope: this
            }];
        },
        createRequest: function() {
            var request = new Sage.SData.Client.SDataSingleResourceRequest(this.getService());

            if (this.entry && this.entry['$key'])
                request.setResourceSelector(String.format("'{0}'", this.entry['$key']));

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
        createTemplateRequest: function() {
            var request = new Sage.SData.Client.SDataTemplateResourceRequest(this.getService());

            if (this.resourceKind)
                request.setResourceKind(this.resourceKind);

            return request;
        },
        createLayout: function() {
            return this.layout || [];
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
                    var ctor = Sage.Platform.Mobile.Controls.FieldManager.get(current['type']),
                        field = this.fields[current['name']] = new ctor(Ext.apply({
                            editor: this
                        }, current)),
                        template = field.propertyTemplate || this.propertyTemplate;

                    content.push(template.apply({
                        label: current['label'],
                        field: field
                    }));
                }
            }

            content.push(this.sectionEndTemplate.apply(options));

            Ext.DomHelper.append(this.contentEl, content.join(''));

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
                if (this.fields[name].alwaysUseValue || this.fields[name].isDirty())
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
                    this.fields[name].el.addClass('panel-field-error');

                    this.errors.push({
                        name: name,
                        message: result
                    });
                }
                else
                {
                    this.fields[name].el.removeClass('panel-field-error');
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
        showValidationSummary: function() {
            var content = [];                        

            for (var i = 0; i < this.errors.length; i++)
                content.push(this.validationSummaryItemTemplate.apply(this.errors[i], this.fields[this.errors[i].name]));

            this.validationContentEl.update(content.join(''));

            ReUI.DomHelper.wait(scrollTo, 0, 0, 1)
        },
        save: function() {
            if (this.isFormDisabled())  return;

            if (this.validate() !== false)
            {
                this.el.addClass('panel-form-error');

                this.showValidationSummary();

                return;
            }
            else
            {
                this.el.removeClass('panel-form-error');
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
})();
