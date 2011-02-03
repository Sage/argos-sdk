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
Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Edit = Ext.extend(Sage.Platform.Mobile.View, {
        attachmentPoints: {
            contentEl: '.panel-content',
            validationContentEl: '.panel-validation-summary > ul'
        },
        viewTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="edit panel {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',            
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
            '<h2 data-action="toggleSection" class="{% if ($.collapsed) { %}collapsed{% } %}">{%: $.title %}<button class="collapsed-indicator"></button></h2>',
            '<fieldset class="{%= $.cls %}">',
            '<a href="#" class="android-6059-fix">fix for android issue #6059</a>'
        ]),
        sectionEndTemplate: new Simplate([
            '</fieldset>'
        ]),
        propertyTemplate: new Simplate([
            '<a name="{%= $.name %}"></a>',
            '<div class="row row-edit {%= $.cls %}" data-field="{%= $.name %}" data-field-type="{%= $.type %}">',            
            '</div>'
        ]),
        transitionEffect: 'slide',
        id: 'generic_edit',
        layout: null,
        layoutCompiled: null,
        layoutCompiledFrom: null,
        enableCustomizations: true,
        customizationSet: 'edit',
        expose: false,
        saveText: 'Save',
        titleText: 'Edit',
        validationSummaryText: 'Validation Summary',
        detailsText: 'Details',
        loadingText: 'loading...',
        requestErrorText: 'A server error occured while requesting data.',
        constructor: function(o) {
            this.fields = {};
            
            Sage.Platform.Mobile.Edit.superclass.constructor.apply(this, arguments);
        },
        render: function() {
            Sage.Platform.Mobile.Edit.superclass.render.apply(this, arguments);
            
            this.processLayout(this.compileLayout(), {title: this.detailsText});

            this.el
                .select('div[data-field]')
                .each(function(value) {
                    var el = Ext.get(value.dom),
                        name = el.getAttribute('data-field'),
                        field = this.fields[name];
                    if (field)
                        field.renderTo(el);
                }, this);
        },
        init: function() {
            Sage.Platform.Mobile.Edit.superclass.init.apply(this, arguments);

            for (var name in this.fields) this.fields[name].init();

            this.tools.tbar = [{
                id: 'save',
                action: 'save'
            },{
                id: 'cancel',
                side: 'left',
                fn: ReUI.back,
                scope: ReUI
            }];
        },        
        invokeAction: function(name, parameters, evt, el) {
            var fieldEl = el.findParent('[data-field]', this.el, true),
                field = this.fields[fieldEl && fieldEl.getAttribute('data-field')];

            if (field && typeof field[name] === 'function')
                return field[name].apply(field, [parameters, evt, el]);

            return Sage.Platform.Mobile.Edit.superclass.invokeAction.apply(this, arguments);
        },
        hasAction: function(name, evt, el) {
            var fieldEl = el && el.findParent('[data-field]', this.el, true),
                field = this.fields[fieldEl && fieldEl.getAttribute('data-field')];

            if (field && typeof field[name] === 'function')
                return true;

            return Sage.Platform.Mobile.Edit.superclass.hasAction.apply(this, arguments);
        },
        toggleSection: function(params) {
            var el = Ext.get(params.$source);
            if (el)
                el.toggleClass('collapsed');
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

            if (this.querySelect)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Select, this.querySelect.join(','));

            if (this.queryInclude)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Include, this.queryInclude.join(','));

            return request;
        },
        createLayout: function() {
            return this.layout || [];
        },
        processLayout: function(layout, layoutOptions)
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
                        this.processLayout(current['as'], current['options']);

                    continue;
                }

                if (!sectionStarted)
                {
                    sectionStarted = true;
                    content.push(this.sectionBeginTemplate.apply(layoutOptions, this));
                }                    
                
                var ctor = Sage.Platform.Mobile.Controls.FieldManager.get(current['type']),
                    field = this.fields[current['name']] = new ctor(Ext.apply({
                        owner: this
                    }, current)),
                    template = field.propertyTemplate || this.propertyTemplate;

                content.push(template.apply(field, this));
            }

            content.push(this.sectionEndTemplate.apply(layoutOptions, this));

            Ext.DomHelper.append(this.contentEl, content.join(''));

            for (var i = 0; i < sectionQueue.length; i++)
            {
                var current = sectionQueue[i];

                this.processLayout(current['as'], current['options']);
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
        requestFailure: function(response, o) {
            alert(String.format(this.requestErrorText, response, o));
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
            alert(String.format(this.requestErrorText, response, o));
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
        convertEntry: function(entry) {
            // todo: should we create a deep copy?
            // todo: do a deep conversion?

            var converter = Sage.Platform.Mobile.Convert;

            for (var n in entry)
            {
                if (converter.isDateString(entry[n]))
                    entry[n] = converter.toDateFromString(entry[n]);                
            }

            return entry;
        },
        convertValues: function(values) {
            // todo: do a deep conversion?

            var converter = Sage.Platform.Mobile.Convert;

            for (var n in values)
            {
                if (values[n] instanceof Date)
                    values[n] = this.getService().isJsonEnabled()
                        ? converter.toJsonStringFromDate(values[n])
                        : converter.toIsoStringFromDate(values[n]);
            }

            return values;
        },
        processEntry: function(entry) {
            this.entry = this.convertEntry(entry || {});

            this.el.removeClass('panel-loading');
        },
        applyContext: function(templateEntry) {
        },
        processTemplateEntry: function(templateEntry) {
            this.templateEntry = this.convertEntry(templateEntry || {});

            this.setValues(this.templateEntry, true);
            this.applyContext(this.templateEntry);

            // if an entry has been passed through options, apply it here, now that the template has been applied.
            // in this case, since we are doing an insert (only time template is used), the entry is applied as modified data.
            if (this.options.entry)
            {
                this.processEntry(this.options.entry);
                this.setValues(this.entry);
            }

            this.el.removeClass('panel-loading');
        },
        clearValues: function() {
            for (var name in this.fields)
            {
                this.fields[name].clearValue();
            }
        },
        setValues: function(values, initial) {
            var noValue = {},
                field,
                path,
                value;

            for (var name in this.fields)
            {
                field = this.fields[name];
                if (field.applyTo !== false)
                {
                    value = Sage.Platform.Mobile.Utility.getValue(values, field.applyTo, noValue);
                }
                else
                {
                    // fyi: uses the fact that ({} !== {})
                    value = Sage.Platform.Mobile.Utility.getValue(values, name, noValue);
                }

                if (value !== noValue) field.setValue(value, initial);
            }
        },
        getValues: function(all) {
            var o = {},
                empty = true,
                field,
                value,
                target,
                included,
                excluded;

            for (var name in this.fields)
            {
                field = this.fields[name];
                value = field.getValue();
                included = typeof field.include === 'function'
                    ? field.include(value, field, this)
                    : field.include;
                excluded = typeof included !== 'undefined' && !included;

                //included = field.include && field.include(value, field, this),
                //excluded = field.include && !included;

                if (all || ((field.alwaysUseValue || field.isDirty() || included) && (!excluded)))
                {
                    if (field.applyTo !== false)
                    {
                        target = Sage.Platform.Mobile.Utility.getValue(o, field.applyTo);
                        Ext.apply(target, value);
                    }
                    else
                    {
                        Sage.Platform.Mobile.Utility.setValue(o, name, value);
                    }

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
        createEntry: function() {
            var values = this.getValues();

            return this.inserting
                ? this.createEntryForInsert(values)
                : this.createEntryForUpdate(values);
        },
        createEntryForUpdate: function(values) {
            values = this.convertValues(values);

            return Ext.apply(values, {
                '$key': this.entry['$key'],
                '$etag': this.entry['$etag'],
                '$name': this.entry['$name']
            });
        },
        createEntryForInsert: function(values) {
            values = this.convertValues(values);
            
            return Ext.apply(values, {
                '$name': this.entityName
            });
        },
        isFormDisabled: function() {
            return this.busy;
        },
        disable: function() {
            this.busy = true;

            if (App.bars.tbar)
                App.bars.tbar.disable();

            this.el.addClass('busy');
        },
        enable: function() {
            this.busy = false;

            if (App.bars.tbar)
                App.bars.tbar.enable();

            this.el.removeClass('busy');
        },
        insert: function() {
            this.disable();

            var values = this.getValues();
            if (values)
            {
                var entry = this.createEntryForInsert(values);

                var request = this.createRequest();
                if (request)
                    request.create(entry, {
                        success: function(created) {
                            this.enable();

                            App.fireEvent('refresh', {
                                resourceKind: this.resourceKind
                            });                            

                            this.insertCompleted(created);
                        },
                        failure: function(response, o) {
                            this.enable();
                            this.requestFailure(response, o);
                        },
                        scope: this
                    });
            }
            else
            {
                ReUI.back();
            }
        },
        insertCompleted: function(entry) {
            if (this.options && this.options.returnTo)
            {
                var returnTo = this.options.returnTo,
                    view = App.getView(returnTo);
                if (view)
                    view.show();
                else
                    window.location.hash = returnTo;
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
                this.disable();

                var entry = this.createEntryForUpdate(values);

                var request = this.createRequest();
                if (request)
                    request.update(entry, {
                        success: function(modified) {
                            this.enable();

                            App.fireEvent('refresh', {
                                resourceKind: this.resourceKind,
                                key: modified['$key'],
                                data: modified
                            });

                            this.updateCompleted(modified);
                        },
                        failure: function(response, o) {
                            this.enable();
                            this.requestFailure(response, o);
                        },
                        scope: this
                    });
            }
            else
            {
                this.updateCompleted(false);
            }
        },
        updateCompleted: function(entry) {
            if (this.options && this.options.returnTo)
            {
                var returnTo = this.options.returnTo,
                    view = App.getView(returnTo);
                if (view)
                    view.show();
                else
                    window.location.hash = returnTo;
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
            this.el.addClass('panel-form-error');
        },
        hideValidationSummary: function() {
            this.el.removeClass('panel-form-error');
            this.validationContentEl.update('');
        },
        save: function() {
            if (this.isFormDisabled())  return;

            this.hideValidationSummary();

            if (this.validate() !== false)
            {
                this.showValidationSummary();
                return;
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
                key: this.options.insert ? false : this.options.entry && this.options.entry['$key']
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
        activate: function() {
            // external navigation (browser back/forward) never refreshes the edit view as it's always a terminal loop.
            // i.e. you never move "forward" from an edit view; you navigate to child editors, from which you always return.
        },       
        refresh: function() {
            this.entry = false;
            this.changes = false;
            this.inserting = (this.options.insert === true);

            this.el.removeClass('panel-form-error');

            this.clearValues();

            if (this.inserting)
            {
                if (this.options.template)                
                    this.processTemplateEntry(this.options.template);
                else
                    this.requestTemplateData();                
            }
            else
            {
                // apply entry as non-modified data
                if (this.options.entry)
                {
                    this.processEntry(this.options.entry);                  
                    this.setValues(this.entry, true);
                }

                // apply changes as modified data, since we want this to feed-back through
                // the changes option is primarily used by editor fields
                if (this.options.changes)
                {
                    this.changes = this.options.changes;
                    this.setValues(this.changes);
                }
            }
        },
        transitionTo: function() {
            Sage.Platform.Mobile.Edit.superclass.transitionTo.call(this);
        }
    });
})();
