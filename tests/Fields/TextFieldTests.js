define('Fields/TextFieldTests', ['dojo/query','dojo/dom-attr','dojo/dom-class','Sage/Platform/Mobile/Fields/TextField'], function(query, domAttr, domClass, TextField) {
return describe('Sage.Platform.Mobile.Fields.TextField', function() {

    it('Can bind onkeypress on init when validInputOnly is true', function() {
        var field = new TextField();

        var previousConnects = field._connects.length;

        field.validInputOnly = true;
        field.init();

        expect(field._connects.length).toEqual(previousConnects + 1);
    });
    it('Can not bind onkeypress on init when validInputOnly is false', function() {
        var field = new TextField();

        var previousConnects = field._connects.length;

        field.init();

        expect(field._connects.length).toEqual(previousConnects);
    });

    it('Can remove disabled state on enable', function() {
        var field = new TextField();

        domAttr.set(field.inputNode, 'disabled', true);
        field.enable();

        expect(domAttr.get(field.inputNode, 'disabled')).toEqual(false);
    });

    it('Can add disabled state on disable', function() {
        var field = new TextField();

        field.disable();

        expect(domAttr.get(field.inputNode, 'disabled')).toEqual(true);
    });

    it('Can call validate on keypress', function() {
        var field = new TextField();

        var evt = { keyChar: 'a' };

        spyOn(field, 'validate').andReturn(false);

        field._onKeyPress(evt);

        expect(field.validate).toHaveBeenCalledWith('a');
    });

    it('Can stop event on false validation of keypress', function() {
        var field = new TextField();

        var evt = {
            keyChar: 'a',
            preventDefault: function() {},
            stopPropagation: function() {}
        };

        spyOn(field, 'validate').andReturn('false');
        spyOn(evt, 'preventDefault');
        spyOn(evt, 'stopPropagation');

        field._onKeyPress(evt);

        expect(evt.preventDefault).toHaveBeenCalled();
        expect(evt.stopPropagation).toHaveBeenCalled();
    });

    it('Can call validation trigger with event on keyup', function() {
        var field = new TextField();

        field.validationTrigger = 'keyup';

        spyOn(field, 'onValidationTrigger');

        field._onKeyUp('test');

        expect(field.onValidationTrigger).toHaveBeenCalledWith('test');
    });

    it('Can call notification trigger with event on keyup', function() {
        var field = new TextField();

        field.notificationTrigger = 'keyup';

        spyOn(field, 'onNotificationTrigger');

        field._onKeyUp('test');

        expect(field.onNotificationTrigger).toHaveBeenCalledWith('test');
    });

    it('Can add active class on focus', function() {
        var field = new TextField();

        domClass.remove(field.domNode, 'text-field-active');

        field._onFocus();

        expect(domClass.contains(field.domNode, 'text-field-active')).toEqual(true);
    });

    it('Can remove active class on blur', function() {
        var field = new TextField();

        domClass.add(field.domNode, 'text-field-active');

        field._onBlur();

        expect(domClass.contains(field.domNode, 'text-field-active')).toEqual(false);
    });

    it('Can call validation trigger with event on blur', function() {
        var field = new TextField();

        field.validationTrigger = 'blur';

        spyOn(field, 'onValidationTrigger');

        field._onBlur('test');

        expect(field.onValidationTrigger).toHaveBeenCalledWith('test');
    });

    it('Can call notification trigger with event on blur', function() {
        var field = new TextField();

        field.notificationTrigger = 'blur';

        spyOn(field, 'onNotificationTrigger');

        field._onBlur('test');

        expect(field.onNotificationTrigger).toHaveBeenCalledWith('test');
    });

    it('Can clear value on clear button click', function() {
        var field = new TextField();
        var fakeClickEvt = {
            preventDefault: function() {},
            stopPropagation: function() {}
        };

        spyOn(field, 'clearValue');

        field._onClearClick(fakeClickEvt);

        expect(field.clearValue).toHaveBeenCalled();
    });

    it('Can get value of inputNode', function() {
        var field = new TextField();

        field.inputNode.value = 'test';

        expect(field.getValue()).toEqual('test');
    });

    it('Can set original value', function() {
        var field = new TextField();

        field.setValue('test', true);

        expect(field.originalValue).toEqual('test');
    });

    it('Can set input value', function() {
        var field = new TextField();

        field.setValue('test');

        expect(field.inputNode.value).toEqual('test');
    });

    it('Can clear value as initial value', function() {
        var field = new TextField();

        spyOn(field, 'setValue');

        field.clearValue();

        expect(field.setValue).toHaveBeenCalledWith('', true);
    });
    it('Can clear value as dirty value', function() {
        var field = new TextField();

        spyOn(field, 'setValue');

        field.clearValue(true);

        expect(field.setValue).toHaveBeenCalledWith('', false);
    });

    it('Can determine if field is dirty (orig value not equal actual value)', function() {
        var field = new TextField();

        spyOn(field, 'getValue').andReturn('dirty');

        field.originalValue = 'orig';

        expect(field.isDirty()).toEqual(true);
    });
    it('Can determine if field is clean (orig value equal actual value)', function() {
        var field = new TextField();

        spyOn(field, 'getValue').andReturn('clean');

        field.originalValue = 'clean';

        expect(field.isDirty()).toEqual(false);
    });
    
    it('Can call onChange when value check fails in the notification handler', function() {
        var field = new TextField();

        field.previousValue = 'test';

        spyOn(field, 'getValue').andReturn('changed');
        spyOn(field, 'onChange');

        field.onNotificationTrigger();

        expect(field.onChange).toHaveBeenCalledWith('changed', field);
    });

    it('Can set previous value to new value when value check fails in the notification handler', function() {
        var field = new TextField();

        field.previousValue = 'test';

        spyOn(field, 'getValue').andReturn('changed');

        field.onNotificationTrigger();

        expect(field.previousValue).toEqual('changed');
    });

    it('Can add error class if validate fails in onValidation handler', function() {
        var field = new TextField();

        field.containerNode = document.createElement('div');

        spyOn(field, 'validate').andReturn(true);

        field.onValidationTrigger();

        expect(domClass.contains(field.containerNode, 'row-error')).toEqual(true);
    });

    it('Can remove error class if validate succeeds in onValidation handler', function() {
        var field = new TextField();

        field.containerNode = document.createElement('div');
        domClass.add(field.containerNode, 'row-error');

        spyOn(field, 'validate').andReturn(false);

        field.onValidationTrigger();

        expect(domClass.contains(field.containerNode, 'row-error')).toEqual(false);
    });

    it('Can change the input type based upon type property at construction', function() {
        var field = new TextField({
            inputType: 'test'
        });

        expect(domAttr.get(field.inputNode, 'type')).toEqual('test');
    });

    it('Can not set a clear button if enable clear button is false', function() {
        var field = new TextField({
            enableClearButton: false
        });

        expect(query('> button', field.domNode).length).toEqual(0);
        expect(field.clearNode).toEqual(null);
    });


});
});