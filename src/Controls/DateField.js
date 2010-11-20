Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    var U = Sage.Platform.Mobile.Utility;

    Sage.Platform.Mobile.Controls.DateField = Ext.extend(Sage.Platform.Mobile.Controls.EditorField, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button whiteButton"><span>{%: $.lookupText %}</span></a>',
            '<input type="text" />'
        ]),
        view: 'generic_calendar',
        emptyText: '',
        formatString: 'MM/dd/yyyy',
        showTimePicker: false,
        formatValue: function(value) {
            return Sage.Platform.Mobile.Format.date(value, this.formatString);
        },
        createNavigationOptions: function() {
            var options = Sage.Platform.Mobile.Controls.DateField.superclass.createNavigationOptions.apply(this, arguments);

            options.date = this.currentValue;
            options.showTimePicker = this.showTimePicker;

            return options;
        },
        getValuesFromView: function() {
            var view = App.getActiveView();
            if (view)
            {
                this.currentValue = this.validationValue = view.getDateTime();
            }
        }
    });

    /*
    Sage.Platform.Mobile.Controls.DateField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
        //TODO: make the input a HTML5 "date" field. Webkit & Chrome, overrides our styles for that.
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
        showTime: false,
        init: function() {
            Sage.Platform.Mobile.Controls.DateField.superclass.init.apply(this, arguments);

            this.containerEl.on('click', this.onClick, this);
        },
        complete: function() {
            var view = App.getActiveView();
            if (view)
            {
                this.currentValue = view.getDateTime();

                this.setText(this.currentValue);

                this.fireEvent('change', this.currentValue, this);

                ReUI.back();
            }
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
                date: this.originalValue,
                showTime: this.showTime
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

            if (this.originalValue && this.currentValue) return !this.originalValue.equals(this.currentValue);

            return false;
        },
        getValue: function() {
            return this.currentValue;
        },
        //FIXME: Date.parse returns NaN for strings like '2006-12-11T00:00:00-07:00'
        setValue: function(val, initial) {
            var d;
            if (typeof val == 'string') d = this.parseDate(val);
            if (!val || !d || d.constructor !== Date) return;

            this.currentValue = d;

            if (initial) this.originalValue = this.currentValue;

            this.setText(d);
        },
        clearValue: function() {
            this.originalValue = this.currentValue = false;
        },
        //TODO: make formatting configurable
        setText: function(val) {
            var time;
            if (this.showTime === true)
                time = val.toString('M/d/yyyy hh:ss');
            else
                time = val.toString('M/d/yyyy');

            this.el.dom.value = time;
        }
    });
        */
    Sage.Platform.Mobile.Controls.FieldManager.register('date', Sage.Platform.Mobile.Controls.DateField);
})();