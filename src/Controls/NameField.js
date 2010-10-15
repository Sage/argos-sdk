// todo: move to argos-saleslogix; this does not belong here.

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.NameField = Ext.extend(Sage.Platform.Mobile.Controls.AddressField, {           
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button whiteButton"><span>{%: $.lookupText %}</span></a>',
            '<input readonly="readonly" type="text" />'
        ]),
        lookupText: '...',
        emptyText: 'no name',
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
                changes: this.currentValue
            };
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('name', Sage.Platform.Mobile.Controls.NameField);
})();