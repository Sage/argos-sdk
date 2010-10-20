Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.TextField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {        
        validationTrigger: false,
        notificationTrigger: false,
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<input type="text" name="{%= $.name %}" class="field-text" {% if ($.readonly) { %} readonly {% } %}>'
        ]),        
        init: function() {
            if (this.validInputOnly)
                this.el.on('keypress', this.onKeyPress, this);

            this.el
                .on('keyup', this.onKeyUp, this)
                .on('blur', this.onBlur, this);
        },
        onKeyPress: function(evt, el, o) {
            var v = this.getValue() + String.fromCharCode(evt.getCharCode());
            if (this.validate(v))
            {
                evt.stopEvent();
                return;
            }            
        },
        onKeyUp: function(evt, el, o) {
            if (this.validationTrigger == 'keyup')
                this.onValidationTrigger(evt, el, o);

            if (this.notificationTrigger == 'keyup')
                this.onNotificationTrigger(evt, el, o);
        },
        onBlur: function(evt, el, o) {
            if (this.validationTrigger == 'blur')
                this.onValidationTrigger(evt, el, o);

            if (this.notificationTrigger == 'blur')
                this.onNotificationTrigger(evt, el, o);
        },
        onNotificationTrigger: function(evt, el, o) {            
            var currentValue = this.getValue();

            if (this.previousValue != currentValue)
                this.fireEvent('change', currentValue, this);

            this.previousValue = currentValue;
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
            this.originalValue = val;
            this.previousValue = false;

            this.el.dom.value = val;
        },
        clearValue: function() {
            this.setValue('');
        },
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('text', Sage.Platform.Mobile.Controls.TextField);
})();