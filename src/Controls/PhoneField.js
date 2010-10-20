Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.PhoneField = Ext.extend(Sage.Platform.Mobile.Controls.TextField, {
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<input type="text" name="{%= name %}">'
        ]),
        /*
            {0}: original value
            {1}: cleaned value
            {2}: entire match (against clean value)
            {3..n}: match groups (against clean value)
        */
        formatters: [{
            test: /^\+.*/,
            format: '{0}'
        },{
            test: /^(\d{3})(\d{3,4})$/,
            format: '{3}-{4}'
        },{
            test: /^(\d{3})(\d{3})(\d{2,})(.*)$/,
            format: '({3})-{4}-{5}{6}'
        }],
        getValue: function() {
            var value = this.el.getValue();

            if (/^\+/.test(value)) return value;

            return value.replace(/[^0-9x]/ig, "");
        },
        setValue: function(val) {
            this.value = val;

            this.el.dom.value = this.formatNumberForDisplay(val);
        },
        formatNumberForDisplay: function(number, clean) {
            if (typeof clean === 'undefined')
                var clean = number;

            for (var i = 0; i < this.formatters.length; i++)
            {
                var formatter = this.formatters[i];
                var match;
                if ((match = formatter.test.exec(clean)))
                    return String.format.apply(String, [formatter.format, number, clean].concat(match));
            }

            return number;
        },               
        onKeyUp: function(evt, el, o) {
            this.el.dom.value = this.formatNumberForDisplay(this.el.dom.value, this.getValue());

            Sage.Platform.Mobile.Controls.PhoneField.superclass.onKeyUp.apply(this, arguments);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('phone', Sage.Platform.Mobile.Controls.PhoneField);
})();