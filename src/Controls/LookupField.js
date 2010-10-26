Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    var U = Sage.Platform.Mobile.Utility;

    Sage.Platform.Mobile.Controls.LookupField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {        
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<a class="button whiteButton"><span>{%: $.lookupText %}</span></a>',
            '<input type="text" {% if ($.requireSelection) { %}readonly="readonly"{% } %} />'
        ]),
        view: false,
        keyProperty: '$key',
        textProperty: '$descriptor',
        textTemplate: false,
        valueKeyProperty: null,
        valueTextProperty: null,
        requireSelection: false,
        emptyText: 'empty',
        completeText: 'Select',
        lookupText: '...',
        init: function() {
            Sage.Platform.Mobile.Controls.LookupField.superclass.init.apply(this, arguments);

            this.containerEl.on('click', this.onClick, this);

            if (this.isReadOnly())
            {
                this.containerEl.addClass('field-disabled');
                this.el.dom.readOnly = true;
            }
            else if (!this.requireSelection)
            {
                this.el
                    .on('keyup', this.onKeyUp, this)
                    .on('blur', this.onBlur, this);
            }
        },
        isReadOnly: function() {
            return !this.view;
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
                        name: 'complete',
                        title: this.completeText,
                        cls: 'button',
                        fn: this.complete,
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
        onKeyUp: function(evt, el, o) {
            if (this.notificationTrigger == 'keyup')
                this.onNotificationTrigger(evt, el, o);
        },
        onBlur: function(evt, el, o) {
            if (this.notificationTrigger == 'blur')
                this.onNotificationTrigger(evt, el, o);
        },
        onNotificationTrigger: function(evt, el, o) {
            var currentValue = this.getValue();

            if (this.previousValue != currentValue)
                this.fireEvent('change', currentValue, this);

            this.previousValue = currentValue;
        },
        setText: function(text) {
            this.el.dom.value = text;

            this.previousValue = text;
        },
        getText: function() {
            return this.el.dom.value;
        },
        complete: function() {
            // todo: should there be a better way?
            var view = App.getActiveView();
            if (view && view.selectionModel)
            {
                var selections = view.selectionModel.getSelections();

                for (var selectionKey in selections)
                {
                    var val = selections[selectionKey].data,
                        key = U.getValue(val, this.keyProperty, val) || selectionKey, // if we can extract the key as requested, use it instead of the selection key
                        text = U.getValue(val, this.textProperty);

                    if (text && this.textTemplate)
                        text = this.textTemplate.apply(text, this);

                    this.currentSelection = val;

                    this.currentValue = {
                        key: key || text,
                        text: text || key
                    };

                    this.setText(text);

                    this.fireEvent('change', this.currentValue, this);

                    // there should only be a single selection
                    break;
                }
                
                ReUI.back();
            }
        },
        isDirty: function() {
            if (this.originalValue && this.currentValue)
            {
                if (this.originalValue.key != this.currentValue.key)
                    return true;

                if (this.originalValue.text != this.currentValue.text)
                    return true;

                if (!this.requireSelection && !this.textTemplate)
                    if (this.originalValue.text != this.getText())
                        return true;                

                return false;
            }

            if (this.originalValue)
            {
                if (!this.requireSelection && !this.textTemplate)
                    if (this.originalValue.text != this.getText())
                        return true; 
            }
            else
            {
                if (!this.requireSelection && !this.textTemplate)
                {
                    var text = this.getText();
                    if (text && text.length > 0)
                        return true;
                }
            }

            return (this.originalValue != this.currentValue);
        },
        getSelection: function() {
            return this.currentSelection;
        },
        getValue: function() {
            var value,
                // if valueKeyProperty or valueTextProperty IS NOT EXPLICITLY set to false
                // and IS NOT defined use keyProperty or textProperty in its place.
                keyProperty = this.valueKeyProperty !== false
                    ? this.valueKeyProperty || this.keyProperty
                    : false,
                textProperty = this.valueTextProperty !== false
                    ? this.valueTextProperty || this.textProperty
                    : false;

            if (keyProperty || textProperty)
            {
                if (this.currentValue)
                {
                    if (keyProperty)
                        value = U.setValue(value || {}, keyProperty, this.currentValue.key);

                    // if a text template has been applied there is no way to guarantee a correct
                    // mapping back to the property
                    if (textProperty && !this.textTemplate)
                        value = U.setValue(value || {}, textProperty, this.requireSelection ? this.currentValue.text : this.getText());
                }
                else if (!this.requireSelection)
                {
                    if (keyProperty)
                        value = U.setValue(value || {}, keyProperty, this.getText());

                    // if a text template has been applied there is no way to guarantee a correct
                    // mapping back to the property
                    if (textProperty && !this.textTemplate)
                    {
                        value = U.setValue(value || {}, textProperty, this.getText());
                    }
                }
            }
            else
            {
                if (this.currentValue)
                {
                    value = this.requireSelection
                        ? this.currentValue.key
                        : this.currentValue.text != this.getText() && !this.textTemplate
                            ? this.getText()
                            : this.currentValue.key;
                }
                else if (!this.requireSelection)
                {
                    value = this.getText();
                }
            }
            
            return value;
        },
        setValue: function(val) {

            this.currentSelection = val;

            // if valueKeyProperty or valueTextProperty IS NOT EXPLICITLY set to false
            // and IS NOT defined use keyProperty or textProperty in its place.
            var keyProperty = this.valueKeyProperty !== false
                    ? this.valueKeyProperty || this.keyProperty
                    : false,
                textProperty = this.valueTextProperty !== false
                    ? this.valueTextProperty || this.textProperty
                    : false;

            if (keyProperty || textProperty)
            {
                var key,
                    text;

                if (keyProperty)
                    key = U.getValue(val, keyProperty);

                if (textProperty)
                    text = U.getValue(val, textProperty);

                if (text && this.textTemplate)
                    text = this.textTemplate.apply(text, this);

                if (key || text)
                {
                    this.originalValue = this.currentValue = {
                        key: key || text,
                        text: text || key
                    };

                    this.setText(this.currentValue.text);
                }
                else
                {
                    this.originalValue = this.currentValue = false;

                    this.setText(this.requireSelection ? this.emptyText : '');    
                }
            }
            else
            {
                if (val)
                {
                    this.originalValue = this.currentValue = {
                        key: val,
                        text: val
                    };

                    this.setText(val);
                }
                else
                {
                    this.originalValue = this.currentValue = false;

                    this.setText(this.requireSelection ? this.emptyText : '');                
                }
            }        
        },
        clearValue: function() {
            this.setValue(false);
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('lookup', Sage.Platform.Mobile.Controls.LookupField);
})();