// todo: move to argos-saleslogix; this does not belong here.

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.NameField = Ext.extend(Sage.Platform.Mobile.Controls.EditorField, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button simpleSubHeaderButton"><span>{%: $.lookupText %}</span></a>',
            '<input readonly="readonly" type="text" />'
        ]),
        emptyText: 'no name',
        createNavigationOptions: function() {
            var options = Sage.Platform.Mobile.Controls.NameField.superclass.createNavigationOptions.apply(this, arguments);
            //Name does not have an entity.
            delete options.entityName;

            return options;
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('name', Sage.Platform.Mobile.Controls.NameField);
})();