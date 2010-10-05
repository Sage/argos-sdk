Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    var U = Sage.Platform.Mobile.Utility;

    Sage.Platform.Mobile.Controls.LookupField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
        attachmentPoints: {
            textEl: 'input'
        },
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button"><span>{%: $.lookupText %}</span></a>',
            '<input type="text" {% if ($.requireSelection) { %}readonly="readonly"{% } %} />'
        ]),
        view: false,
        cls: 'field-lookup',
        keyProperty: '$key',
        textProperty: '$descriptor',
        requireSelection: true,
        emptyText: 'empty',
        lookupText: 'L',
        init: function() {
            Sage.Platform.Mobile.Controls.LookupField.superclass.init.apply(this, arguments);

            this.el.on('click', this.onClick, this);
        },
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        createNavigationOptions: function() {
            return {
                selectionOnly: true,
                singleSelect: true,
                resourceKind: this.resourceKind,
                resourcePredicate: this.resourcePredicate,
                where: this.where,
                orderBy: this.orderBy,
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
        },
        navigateToListView: function() {
            var view = App.getView(this.view),
                options = this.createNavigationOptions();
            if (view && options)
                view.show(options);
        },
        onClick: function(evt, el, o) {
            if (this.readOnly) this.navigateToListView();

            evt.stopEvent();
        },
        setDisplayText: function(text) {
            this.textEl.dom.value = text;  
        },
        getDisplayText: function() {
            return this.textEl.dom.value;
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

                    this.setDisplayText(text);
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
                U.setValue(value, this.keyProperty, this.selected.key);
            }
            else
            {
                var value = this.requireSelection
                    ? this.selected.key
                    : this.getDisplayText();
            }

            return value;
        },
        extractKey: function(val) {
            return this.keyProperty
                ? U.getValue(val, this.keyProperty)
                : val;
        },
        extractText: function(val, key) {
            var key = key || this.extractKey(val), textValue,
                text = this.textProperty
                    ? U.getValue(val, this.textProperty)
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

            this.setDisplayText(text);
        },
        clearValue: function() {
            this.setValue(false);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('lookup', Sage.Platform.Mobile.Controls.LookupField);
})();
