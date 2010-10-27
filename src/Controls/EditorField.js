// todo: move to argos-saleslogix; this does not belong here.

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.EditorField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button whiteButton"><span>{%: $.lookupText %}</span></a>',
            '<input type="text" />'
        ]),
        lookupText: '...',
        emptyText: 'empty',
        completeText: 'Ok',
        formatter: function(val) {
            return '';
        },
        init: function() {
            Sage.Platform.Mobile.Controls.EditorField.superclass.init.apply(this, arguments);

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
                // todo: is this the appropriate way to handle this?  do not want $key, $name, etc., when applying values.
                // difference is primarily "as component" vs. "as child".
                this.currentValue = this.applyTo ? view.getValues() : view.createEntry();
                this.validationValue = view.getValues(true); // store all editor values for validation, not only dirty values

                this.setText(this.formatter(this.validationValue, true, true));

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
        validate: function(value) {            
            return typeof value === 'undefined'
                ? Sage.Platform.Mobile.Controls.EditorField.superclass.validate.call(this, this.validationValue)
                : Sage.Platform.Mobile.Controls.EditorField.superclass.validate.apply(this, arguments);
        },
        setValue: function(val)
        {            
            if (val)
            {
                this.originalValue = this.validationValue = this.currentValue = val;

                this.setText(this.formatter(val, true, true));
            }
            else
            {
                this.originalValue = this.validationValue = this.currentValue = null;

                this.setText(this.emptyText);
            }
        },
        clearValue: function() {
            this.setValue(null);
        }
    });
})();