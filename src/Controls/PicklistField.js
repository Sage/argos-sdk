// todo: move to argos-saleslogix; this does not belong here.

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    var viewsByName = {},
        viewsByNameCount = 0;         

    var getOrCreateViewFor = function(name) {
        if (viewsByName[name])
            return viewsByName[name];

        var view = new Mobile.SalesLogix.PickList({
            id: 'pick_list_' + viewsByNameCount++,
            expose: false
        });

        App.registerView(view);

        return (viewsByName[name] = view);
    };

    Sage.Platform.Mobile.Controls.PicklistField = Ext.extend(Sage.Platform.Mobile.Controls.LookupField, {
        picklist: false,
        orderBy: 'sort asc',
        storageMode: 'text',
        dependentErrorText: "A value for '{0}' must be selected.",
        valueKeyProperty: false,
        valueTextProperty: false,
        constructor: function() {
            Sage.Platform.Mobile.Controls.PicklistField.superclass.constructor.apply(this, arguments);

            switch (this.storageMode)
            {
                case 'text':
                    this.keyProperty = 'text';
                    this.textProperty = 'text';
                    break;
                case 'code':
                    this.keyProperty = 'code';
                    this.textProperty = 'text';
                    break;
                case 'id':
                    this.keyProperty = '$key';
                    this.textProperty = 'text';
                    break;
            }
        },        
        getDependentValue: function() {
            if (this.dependsOn && this.owner)
            {
                var field = this.owner.fields[this.dependsOn];
                if (field) return field.getValue();
            }
        },
        getDependentLabel: function() {
            if (this.dependsOn && this.owner)
            {
                var field = this.owner.fields[this.dependsOn];
                if (field) return field.label;
            }
        },
        formatResourcePredicate: function(name) {
            return String.format('name eq "{0}"', name);
        },
        createNavigationOptions: function() {
            var options = Sage.Platform.Mobile.Controls.PicklistField.superclass.createNavigationOptions.apply(this, arguments),
                dependentValue = this.getDependentValue();

            if (this.dependsOn && !dependentValue)
            {
                alert(String.format(this.dependentErrorText, this.getDependentLabel()));
                return false;
            }

            if (this.picklist)
                options.resourcePredicate = this.formatResourcePredicate(
                    this.dependsOn // only pass dependentValue if there is a dependency
                        ? this.expandExpression(this.picklist, dependentValue)
                        : this.expandExpression(this.picklist)
                );

            options.dependentValue = dependentValue;
            options.title = this.title;

            return options;
        },
        navigateToListView: function() {
            var options = this.createNavigationOptions(),
                view = App.getView(this.view) || getOrCreateViewFor(this.picklist);
           
            if (view && options)
                view.show(options);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('picklist', Sage.Platform.Mobile.Controls.PicklistField);
})();