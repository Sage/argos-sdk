Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.TextField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
        template: new Simplate([
            '<input type="text" name="{%= name %}" class="field-text" {% if ($.readonly) { %} readonly {% } %}>',
        ]),
        bind: function(container) {
            Sage.Platform.Mobile.Controls.TextField.superclass.bind.apply(this, arguments);

            if (this.validInputOnly)
            {
                this.el.on('keypress', this.onKeyPress, this);
            }
            else
            {
                switch (this.validationTrigger)
                {
                    case 'keyup':
                        this.el.on('keyup', this.onValidationTrigger, this);
                        break;
                    case 'blur':
                        this.el.on('blur', this.onValidationTrigger, this);
                        break;
                }
            }
        },
        onKeyPress: function(evt, el, o) {
            if (this.validInputOnly)
            {
                var v = this.getValue() + String.fromCharCode(evt.getCharCode());
                if (this.validate(v))
                {
                    evt.stopEvent();
                    return;
                }
            }
        },
        onValidationTrigger: function(evt, el, o) {
            if (this.validate())
                this.el.addClass('field-error');
            else
                this.el.removeClass('field-error');
        },
        getValue: function() {
            return this.el.getValue();
        },
        setValue: function(val) {
            this.value = val;

            this.el.dom.value = val;
        },
        clearValue: function() {
            this.setValue('');
        },
        isDirty: function() {
            return (this.value != this.getValue());
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('text', Sage.Platform.Mobile.Controls.TextField);
})();