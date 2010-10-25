Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.DecimalField = Ext.extend(Sage.Platform.Mobile.Controls.TextField, {
        precision: 2,
        setValue: function(val) {
            val = parseFloat(val, 10).toFixed(this.precision || 2);
            val = isNaN(val) ? '0.00' : val;
            Sage.Platform.Mobile.Controls.DecimalField.superclass.setValue.call(this, val);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('decimal', Sage.Platform.Mobile.Controls.DecimalField);
})();