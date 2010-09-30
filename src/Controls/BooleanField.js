Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.BooleanField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
        attachmentPoints: {
            el: 'div[name="{0}"]'
        },
        template: new Simplate([
            '<div name="{%= $.name %}" class="field-boolean toggle" toggled="{%= !!$.checked %}">',
            '<span class="thumb"></span>',
            '<span class="toggleOn">{%= $.onText %}</span>',
            '<span class="toggleOff">{%= $.offText %}</span>',
            '</div>'
        ]),
        onText: 'ON',
        offText: 'OFF',        
        init: function() {
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