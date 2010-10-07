Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.SelectField = Ext.extend(Sage.Platform.Mobile.Controls.LookupField, {
        createNavigationOptions: function() {
            var options = Sage.Platform.Mobile.Controls.PicklistField.superclass.createNavigationOptions.apply(this, arguments);

            options.data = this.data;

            return options;
        }        
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('select', Sage.Platform.Mobile.Controls.SelectField);
})();