// todo: move to argos-saleslogix; this does not belong here.

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.AddressField = Ext.extend(Sage.Platform.Mobile.Controls.EditorField, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button simpleSubHeaderButton"><span>{%: $.lookupText %}</span></a>',
            '<textarea readonly="readonly" rows="{%: $.rows %}" />'
        ]),
        rows: 4,
        emptyText: 'no address'
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('address', Sage.Platform.Mobile.Controls.AddressField);
})();