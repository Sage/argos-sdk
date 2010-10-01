Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.BooleanField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {        
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<div name="{%= $.name %}" class="field-boolean toggle" toggled="{%= !!$.checked %}">',
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
            this.el.dom.setAttribute('toggled', this.el.getAttribute('toggled') !== 'true');
        },
        getValue: function() {
            return this.el.getAttribute('toggled') === 'true';
        },
        setValue: function(val) {
            this.value = typeof val === 'string'
                ? /^true$/i.test(val)
                : !!val;

            this.el.dom.setAttribute('toggled', this.value.toString());
        },
        clearValue: function() {
            this.setValue(this.checked);
        },
        isDirty: function() {
            return (this.value != this.getValue());
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('boolean', Sage.Platform.Mobile.Controls.BooleanField);
})();