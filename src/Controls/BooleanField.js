Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.BooleanField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
        selector: 'div[name="{0}"]',
        template: new Simplate([
            '<div name="{%= name %}" class="field-boolean toggle" toggled="{%= !!$.checked %}">',
            '<span class="thumb"></span>',
            '<span class="toggleOn">{%= $.onText %}</span>',
            '<span class="toggleOff">{%= $.offText %}</span>',
            '</div>'
        ]),
        onText: 'ON',
        offText: 'OFF',
        constructor: function(o) {
            Sage.Platform.Mobile.Controls.BooleanField.superclass.constructor.apply(this, arguments);
        },
        bind: function(container) {
            Sage.Platform.Mobile.Controls.BooleanField.superclass.bind.apply(this, arguments);

            this.el.on('click', this.onClick, this, {stopEvent: true});
        },
        onClick: function(evt, el, o) {
            this.el.dom.setAttribute('toggled', this.el.getAttribute('toggled') !== 'true');
        },
        getValue: function() {
            return this.el.getAttribute('toggled') === 'true';
        },
        setValue: function(val) {
            if (val == "true") val = true;
            if (val == "false") val = false;

            this.value = !!val;
            var checked = this.value ? 'true' : 'false';
            this.el.dom.setAttribute('toggled', checked);
        },
        clearValue: function() {
            this.setValue(!!this.checked);
        },
        isDirty: function() {
            return (this.value != this.getValue());
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('boolean', Sage.Platform.Mobile.Controls.BooleanField);
})();