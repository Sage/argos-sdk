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

    Sage.Platform.Mobile.Controls.FieldManager.register('date', Sage.Platform.Mobile.Controls.DateField);
})();