Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.PickupField = Ext.extend(Sage.Platform.Mobile.Controls.LookupField, {
        keyProperty: false,
        textProperty: false,
        getViewOptions: function() {
            var parentValue, parentValueObj,
                parentField, resPredicate = this.resourcePredicate,
                options = Sage.Platform.Mobile.Controls.PickupField.superclass.getViewOptions.call(this);

            options.resourceProperty = 'items';

            if (this.dependsOn)
            {
                parentField = this.editor.fields[this.dependsOn];
                parentValue = parentField.getValue();

                if (!parentValue)
                {
                    if (this.errMsg) alert(this.errMsg);
                    return;
                }

                if (typeof this.resourcePredicate == "function")
                {
                    resPredicate = this.resourcePredicate.call(this.editor, parentValue);
                }
                else if (typeof this.resourcePredicate != "string")
                {
                    parentValueObj = {};
                    parentValueObj[this.dependsOn] = parentValue;
                    resPredicate = this.resourcePredicate.apply(parentValueObj);
                }
            }

            if (resPredicate)
            {
                options['resourcePredicate'] = resPredicate;
            }

            if (this.orderBy)
            {
                options['orderBy'] = this.orderBy;
            }

            return options;
        },
        setValue: function(val) {
            // todo: must revisit. This is not the right way to do.
            if (typeof val == "string") {
                this.value = this.selected = {
                    key: val,
                    text: val
                };
                this.el.select('a > span').item(0).dom.innerHTML = val;
                return;
            }
            else if (val === null) {
                val = false;
            }
            Sage.Platform.Mobile.Controls.PickupField.superclass.setValue.call(this, val);
        },
        select: function() {
            if (this.keyProperty)
            {
                Sage.Platform.Mobile.Controls.PickupField.superclass.select.call(this);
                return;
            }

            var view = App.getActiveView();
            if (view && view.selectionModel)
            {
                var selections = view.selectionModel.getSelections();

                for (var key in selections)
                {
                    var val = selections[key].data.text;
                    this.selected = {
                        key: val,
                        text: val
                    };

                    this.el.select('a > span').item(0).dom.innerHTML = val; // todo: temporary
                    break;
                }

                ReUI.back();
            }
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('pickup', Sage.Platform.Mobile.Controls.PickupField);
})();