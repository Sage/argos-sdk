Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
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
            //TODO: Need to find a way to figure out a Simplate Object
            if (this.where && typeof this.where != 'string') options.where = this.where.apply(this.editor.entry);

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

    Sage.Platform.Mobile.Controls.FieldManager.register('lookup', Sage.Platform.Mobile.Controls.LookupField);
})();