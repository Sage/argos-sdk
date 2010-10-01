Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.PicklistField = Ext.extend(Sage.Platform.Mobile.Controls.LookupField, {
        picklist: false,
        orderBy: 'sort asc',
        dependantErrorText: "A value for '{0}' must be selected.", 
        getDependantValue: function() {
            if (this.dependsOn)
            {
                var field = this.view.fields[this.dependsOn];
                if (field) return field.getValue();
            }
        },
        getDependantLabel: function() {
            if (this.dependsOn)
            {
                var field = this.view.fields[this.dependsOn];
                if (field) return field.label;
            }
        },
        formatResourcePredicate: function(name) {
            return String.format('name eq "{0}"', name);
        },
        createNavigationOptions: function() {
            var options = Sage.Platform.Mobile.Controls.PicklistField.superclass.createNavigationOptions.apply(this, arguments),
                dependantValue = this.getDependantValue();

            if (this.dependsOn && typeof dependantValue === 'undefined')
            {
                alert(String.format(this.dependantErrorText, this.getDependantLabel()));
                return false;
            }

            if (this.picklist)
                options.resourcePredicate = this.formatResourcePredicate(
                    this.expandExpression(this.picklist, dependantValue)
                );

            options.dependantValue = dependantValue;

            return options;
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('picklist', Sage.Platform.Mobile.Controls.PicklistField);
})();