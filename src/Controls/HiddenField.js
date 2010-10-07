Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.HiddenField = Ext.extend(Sage.Platform.Mobile.Controls.TextField, {
        propertyTemplate: new Simplate([
            '<div style="display: none;" data-field="{%= $.name %}" data-field-type="{%= $.type %}">',
            '</div>'
        ]),
        template: new Simplate([
            '<input type="hidden" class="field-text">'
        ]),
        bind: function() {
            // call field's bind. we don't want event handlers for this.
            Sage.Platform.Mobile.Controls.Field.prototype.bind.apply(this, arguments);
        }       
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('hidden', Sage.Platform.Mobile.Controls.HiddenField);
})();