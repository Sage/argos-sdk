Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    var viewsByName = {},
        viewsByNameCount = 0;         

    var getOrCreateViewFor = function(name) {
        if (viewsByName[name])
            return viewsByName[name];

        var view = new Mobile.SalesLogix.PickList({
            id: 'picklist_' + viewsByNameCount++,
            expose: false
        });

        App.registerView(view);

        return (viewsByName[name] = view);
    };

    Sage.Platform.Mobile.Controls.PicklistField = Ext.extend(Sage.Platform.Mobile.Controls.LookupField, {
        picklist: false,
        orderBy: 'sort asc',
        storageMode: 'text',
        dependantErrorText: "A value for '{0}' must be selected.",
        resultKeyProperty: false,
        resultTextProperty: false,       
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
        getDependantValue: function() {
            if (this.dependsOn && this.owner)
            {
                var field = this.owner.fields[this.dependsOn];
                if (field) return field.getValue();
            }
        },
        getDependantLabel: function() {
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
                dependantValue = this.getDependantValue();

            if (this.dependsOn && !dependantValue)
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