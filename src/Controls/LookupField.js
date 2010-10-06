Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    var U = Sage.Platform.Mobile.Utility;

    Sage.Platform.Mobile.Controls.LookupField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {
        attachmentPoints: {
            textEl: 'input'
        },
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button"><span>{%: $.lookupText %}</span></a>',
            '<input type="text" {% if ($.requireSelection) { %}readonly="readonly"{% } %} />'
        ]),
        view: false,
        keyProperty: '$key',
        textProperty: '$descriptor',
        resultKeyProperty: '$key',
        resultTextProperty: '$descriptor',
        requireSelection: true,
        emptyText: 'empty',
        lookupText: 'L',
        init: function() {
            Sage.Platform.Mobile.Controls.LookupField.superclass.init.apply(this, arguments);

            this.el.on('click', this.onClick, this);
        },
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        createNavigationOptions: function() {
            return {
                selectionOnly: true,
                singleSelect: true,
                resourceKind: this.resourceKind,
                resourcePredicate: this.resourcePredicate,
                where: this.where,
                orderBy: this.orderBy,
                tools: {
                    tbar: [{
                        name: 'select',
                        title: 'Select',
                        cls: 'button',
                        fn: this.select,
                        scope: this
                    }]
                }
            };
        },
        navigateToListView: function() {
            var view = App.getView(this.view),
                options = this.createNavigationOptions();
            if (view && options)
                view.show(options);
        },
        onClick: function(evt, el, o) {
            if (evt.getTarget('a') || this.requireSelection)
            {
                evt.stopEvent();
                
                this.navigateToListView();
            }
        },
        setText: function(text) {
            this.textEl.dom.value = text;  
        },
        getText: function() {
            return this.textEl.dom.value;
        },
        select: function() {
            // todo: should there be a better way?
            var view = App.getActiveView();
            if (view && view.selectionModel)
            {
                var selections = view.selectionModel.getSelections();

                for (var key in selections)
                {
                    var val = selections[key].data,
                        key = this.extractKey(val) || key, // if we can extract the key as requested, use it instead of the selection key
                        text = this.extractText(val, key);

                    this.selected = {
                        key: key,
                        text: text
                    };

                    this.setText(text);
                    break;
                }
                ReUI.back();
            }
        },
        isDirty: function() {
            if (!this.value && this.selected) return true;

            if (this.value && this.selected) return this.value.key !== this.selected.key;

            return false;
        },
        getValue: function() {
            var value;

            if (this.resultKeyProperty || this.resultTextProperty)
            {
                if (this.selected)
                {
                    if (this.resultKeyProperty)
                        value = U.setValue(value || {}, this.resultKeyProperty, this.selected.key);

                    if (this.resultTextProperty)
                        value = U.setValue(value || {}, this.resultTextProperty, this.selected.text);
                }
                else if (!this.requireSelection)
                {
                    if (this.resultKeyProperty)
                        value = U.setValue(value || {}, this.resultKeyProperty, this.getText());

                    if (this.resultTextProperty)
                        value = U.setValue(value || {}, this.resultTextProperty, this.getText());
                }
            }
            else
            {
                if (this.selected)
                {
                    value = this.selected.key;
                }
                else if (!this.requireSelection)
                {
                    value = this.getText();
                }
            }
            
            return value;
        },
        extractKey: function(val) {
            return this.keyProperty
                ? U.getValue(val, this.keyProperty)
                : val;
        },
        extractText: function(val, key) {
            var key = key || this.extractKey(val), textValue,
                text = this.textProperty
                    ? U.getValue(val, this.textProperty)
                    : key;

            textValue = this.textProperty ? text : val;
            if (this.textTemplate && textValue)
                text = this.textTemplate.apply(textValue);

            return (text || this.emptyText);
        },
        setValue: function(val) {
            if (val)
            {
                var key = this.extractKey(val),
                    text = this.extractText(val, key);

                this.value = this.selected = {
                    key: key,
                    text: text
                };

                this.setText(text);
            }
            else
            {
                this.value = this.selected = false;

                this.setText(this.requireSelection ? this.emptyText : '');                
            }
        },
        clearValue: function() {
            this.setValue(false);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('lookup', Sage.Platform.Mobile.Controls.LookupField);
})();
