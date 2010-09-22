Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.SelectField = Ext.extend(Sage.Platform.Mobile.Controls.LookupField, {
        getViewOptions: function() {
            var options = Sage.Platform.Mobile.Controls.SelectField.superclass.getViewOptions.call(this);

            options.list = this.list;
            return options;
        },
        setValue: function(val) {
            // todo: must revisit. This is not the right way to do.
            if (typeof val == "string") {
                //Loop through the given list to find a value.
                var selectedVal;
                for (var i = 0, len = this.list.length; i < len; i++)
                {
                    if (this.list[i][this.keyProperty] == val)
                    {
                        selectedVal= this.list[i];
                        break;
                    }
                }
                if (selectedVal)
                {
                    this.value = this.selected = {
                        key: selectedVal[this.keyProperty],
                        text: selectedVal[this.textProperty]
                    };
                    this.el.select('a > span').item(0).dom.innerHTML = selectedVal[this.textProperty];
                    return;
                }
            }
            Sage.Platform.Mobile.Controls.SelectField.superclass.setValue.call(this, val);
        },
        getValue: function() {
            var value = Sage.Platform.Mobile.Controls.SelectField.superclass.getValue.call(this);
            if (value && value[this.keyProperty])
            {
                return value[this.keyProperty];
            }
            return value;
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('select', Sage.Platform.Mobile.Controls.SelectField);
})();