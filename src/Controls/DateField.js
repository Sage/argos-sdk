Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    var U = Sage.Platform.Mobile.Utility;

    Sage.Platform.Mobile.Controls.DateField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button whiteButton"><span>{%: $.lookupText %}</span></a>',
            '<input type="text" readonly="readonly" />'
        ]),
        textTemplate: false,
        emptyText: 'empty',
        completeText: 'Select',
        lookupText: '...',
        view: 'generic_calendar',
        init: function() {
            Sage.Platform.Mobile.Controls.DateField.superclass.init.apply(this, arguments);

            this.containerEl.on('click', this.onClick, this);
        },
        complete: function() {
            var view = App.getActiveView();
            this.currentValue = view.date;
            this.setText(this.currentValue);
            ReUI.back();
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
                date: this.originalValue
            };
        },
        navigateToDateView: function() {
            var view = App.getView(this.view),
                options = this.createNavigationOptions();
            if (view && options)
                view.show(options);
        },
        onClick: function(evt, el, o) {
            if (evt.getTarget('a'))
            {
                evt.stopEvent();
                
                this.navigateToDateView();
            }
        },
        isDirty: function() {
            if (!this.originalValue && this.currentValue) return true;

            if (this.originalValue && this.currentValue) return !Date.equals(this.originalValue, this.currentValue);

            return false;
        },
        getValue: function() {
            return this.currentValue;
        },
        //FIXME: Date.parse returns NaN for strings like '2006-12-11T00:00:00-07:00'
        setValue: function(val) {
            var d;
            if (typeof val == 'string') d = Date.parse(val);

            if (!val || !d || d.constructor !== Date) return;

            this.originalValue = d;

            this.setText(d);
        },
        clearValue: function() {
            this.originalValue = this.currentValue = false;
        },
        //TODO: make formatting configurable
        setText: function(val) {
            this.el.dom.value = String.format('{0}-{1}-{2}', (val.getMonth()+1), val.getDate(), val.getFullYear());
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('date', Sage.Platform.Mobile.Controls.DateField);
})();