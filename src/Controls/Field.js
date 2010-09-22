Ext.namespace('Sage.Platform.Mobile.Controls');

Sage.Platform.Mobile.Controls.FieldManager = (function() {
    var types = {};
    return {
        types: types,
        register: function(name, ctor) {
            types[name] = ctor;
        },
        get: function(name) {
            return types[name];
        }
    };
})();

(function() {
    Sage.Platform.Mobile.Controls.Field = function(o) {
        Ext.apply(this, o);
    };

    Sage.Platform.Mobile.Controls.Field.prototype = {
        selector: 'input[name="{0}"]',
        apply: function(external) {
            return this.template.apply(this);
        },
        bind: function(container) {
            this.el = container.child(String.format(this.selector, this.name));
        },
        isDirty: function() {
            return true;
        },
        validate: function(value) {
            if (typeof this.validator === 'undefined')
                return false;

            if (this.validator instanceof RegExp)
                var definition = {
                    test: this.validator
                };
            else if (typeof this.validator === 'function')
                var definition = {
                    fn: this.validator
                };
            else
                var definition = this.validator;

            var value = typeof value === 'undefined'
                ? this.getValue()
                : value;

            if (typeof definition.fn === 'function')
            {
                return definition.fn.call(definition.scope || this, value, this.editor);
            }
            else if (definition.test instanceof RegExp)
            {
                if (!definition.test.test(value))
                {
                    var message = typeof definition.message === 'function'
                        ? definition.message.call(definition.scope || this, value)
                        : String.format(definition.message, value);

                    return message || true;
                }
            }

            return false;
        }
    };
})();