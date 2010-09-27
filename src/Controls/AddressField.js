Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
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
                        entry = this.value;
                    }
                    else
                    {
                        entry = this.editor.entry[this.name];
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
                Ext.apply(this.value, this.finalValue);
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
            if (this.finalValue) return this.finalValue;
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

    Sage.Platform.Mobile.Controls.FieldManager.register('address', Sage.Platform.Mobile.Controls.AddressField);
})();