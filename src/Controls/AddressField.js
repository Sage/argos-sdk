// todo: move to argos-saleslogix; this does not belong here.

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.AddressField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {           
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button whiteButton"><span>{%: $.lookupText %}</span></a>',
            '<textarea readonly="readonly" rows="{%: $.rows %}" />'
        ]),
        rows: 4,
        lookupText: '...',
        emptyText: 'no address',
        completeText: 'Ok',
        formatter: function(val) {
            return '';
        },
        init: function() {
            Sage.Platform.Mobile.Controls.AddressField.superclass.init.apply(this, arguments);

            this.containerEl.on('click', this.onClick, this, {stopEvent: true});
        },        
        createNavigationOptions: function() {
            return {
                tools: {
                    tbar: [{
                        name: 'complete',
                        title: this.completeText,
                        cls: 'button',
                        fn: this.complete,
                        scope: this
                    }]
                },
                entry: this.originalValue,
                changes: this.currentValue,
                entityName: this.owner && this.owner.entityName
            };
        },
        navigateToEditView: function() {
            var view = App.getView(this.view),
                options = this.createNavigationOptions();
            if (view && options)
                view.show(options);
        },
        onClick: function(evt, el, o) {
            evt.stopEvent();

            this.navigateToEditView();
        },
        complete: function() {
            var view = App.getActiveView();
            if (view)
            {
                this.currentValue = view.createEntry();

                this.setText(this.formatter(view.getValues(true), true, true));

                this.fireEvent('change', this.currentValue, this);
            }

            ReUI.back();
        },
        setText: function(text) {
            this.el.dom.value = text;
        },        
        isDirty: function() {
            return this.originalValue !== this.currentValue;
        },
        getValue: function() {
            return this.currentValue;
        },
        setValue: function(val)
        {            
            if (val)
            {
                this.originalValue = this.currentValue = val;

                this.setText(this.formatter(val, true, true));
            }
            else
            {
                this.originalValue = this.currentValue = null;

                this.setText(this.emptyText);
            }
        },
        clearValue: function() {
            this.setValue(null);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('address', Sage.Platform.Mobile.Controls.AddressField);
})();