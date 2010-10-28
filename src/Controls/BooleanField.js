Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.BooleanField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {        
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<div class="field-boolean toggle" toggled="{%= !!$.checked %}">',
            '<span class="thumb"></span>',
            '<span class="toggleOn">{%= $.onText %}</span>',
            '<span class="toggleOff">{%= $.offText %}</span>',
            '</div>'
        ]),        
        onText: 'ON',
        offText: 'OFF',        
        init: function() {
            Sage.Platform.Mobile.Controls.BooleanField.superclass.init.apply(this, arguments);

            this.el.on('click', this.onClick, this, {stopEvent: true});
        },
        onClick: function(evt, el, o) {
            var toggledValue = this.el.getAttribute('toggled') !== 'true';

            this.el.dom.setAttribute('toggled', toggledValue);

            this.fireEvent('change', toggledValue, this);
        },
        getValue: function() {
            return this.el.getAttribute('toggled') === 'true';
        },
        setValue: function(val, initial) {
            val = typeof val === 'string'
                ? /^true$/i.test(val)
                : !!val;

            if (initial) this.originalValue = val;

            this.el.dom.setAttribute('toggled', val.toString());
        },
        clearValue: function() {
            this.setValue(this.checked, true);
        },
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('boolean', Sage.Platform.Mobile.Controls.BooleanField);
})();