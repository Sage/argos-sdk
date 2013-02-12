define([
    'doh/runner',
    'dojo/query',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/on',
    'argos/Fields/TextField'
], function (doh, query, domAttr, domClass, on, TextField) {
    doh.register('argos-tests.src.Fields.TextField', [
        {
            name:'Can bind onkeypress of inputNode on startup when validInputOnly is true',
            runTest:function () {

                var field = new TextField();

                field.validInputOnly = true;
                field.startup();

                var spy = doh.spyOn(field, '_onKeyPress');

                on.emit(field.inputNode, "keypress", {
                    bubbles: true,
                    cancelable: true
                });

                doh.assertWasCalled(spy);
            }
        },
        {
            name:'Can not bind onkeypress on startup when validInputOnly is false',
            runTest:function () {

                var field = new TextField();

                var previousConnects = field._connects.length;

                field.startup();

                doh.assertEqual(field._connects.length, previousConnects);
            }
        },

        {
            name:'Can remove disabled state on enable',
            runTest:function () {

                var field = new TextField();

                domAttr.set(field.inputNode, 'disabled', true);
                field.enable();

                doh.assertEqual(domAttr.get(field.inputNode, 'disabled'), false);
            }
        },

        {
            name:'Can add disabled state on disable',
            runTest:function () {

                var field = new TextField();

                field.disable();

                doh.assertEqual(domAttr.get(field.inputNode, 'disabled'), true);
            }
        },

        {
            name:'Can call validate on keypress',
            runTest:function () {

                var field = new TextField();

                var evt = { keyChar:'a' };

                var spy = doh.spyOn(field, 'validate').andReturn(false);

                field._onKeyPress(evt);

                doh.assertWasCalledWith(spy, ['a']);
            }
        },

        {
            name:'Can stop event on false validation of keypress',
            runTest:function () {

                var field = new TextField();

                var evt = {
                    keyChar:'a',
                    preventDefault:function () {
                    },
                    stopPropagation:function () {
                    }
                };

                doh.spyOn(field, 'validate').andReturn('false');
                var spyDef = doh.spyOn(evt, 'preventDefault');
                var spyProp = doh.spyOn(evt, 'stopPropagation');

                field._onKeyPress(evt);

                doh.assertWasCalled(spyDef);
                doh.assertWasCalled(spyProp);
            }
        },

        {
            name:'Can call validation trigger with event on keyup',
            runTest:function () {

                var field = new TextField();

                field.validationTrigger = 'keyup';

                var spy = doh.spyOn(field, 'onValidationTrigger');

                field._onKeyUp('test');

                doh.assertWasCalledWith(spy, ['test']);
            }
        },

        {
            name:'Can call notification trigger with event on keyup',
            runTest:function () {

                var field = new TextField();

                field.notificationTrigger = 'keyup';

                var spy = doh.spyOn(field, 'onNotificationTrigger');

                field._onKeyUp('test');

                doh.assertWasCalledWith(spy, ['test']);
            }
        },

        {
            name:'Can add active class on focus',
            runTest:function () {

                var field = new TextField();

                domClass.remove(field.domNode, 'text-field-active');

                field._onFocus();

                doh.assertEqual(domClass.contains(field.domNode, 'text-field-active'), true);
            }
        },

        {
            name:'Can remove active class on blur',
            runTest:function () {

                var field = new TextField();

                domClass.add(field.domNode, 'text-field-active');

                field._onBlur();

                doh.assertEqual(domClass.contains(field.domNode, 'text-field-active'), false);
            }
        },

        {
            name:'Can call validation trigger with event on blur',
            runTest:function () {

                var field = new TextField();

                field.validationTrigger = 'blur';

                var spy = doh.spyOn(field, 'onValidationTrigger');

                field._onBlur('test');

                doh.assertWasCalledWith(spy, ['test']);
            }
        },

        {
            name:'Can call notification trigger with event on blur',
            runTest:function () {

                var field = new TextField();

                field.notificationTrigger = 'blur';

                var spy = doh.spyOn(field, 'onNotificationTrigger');

                field._onBlur('test');

                doh.assertWasCalledWith(spy, ['test']);
            }
        },

        {
            name:'Can clear value on clear button click',
            runTest:function () {

                var field = new TextField();
                var fakeClickEvt = {
                    preventDefault:function () {
                    },
                    stopPropagation:function () {
                    }
                };

                var spy = doh.spyOn(field, 'clearValue');

                field._onClearClick(fakeClickEvt);

                doh.assertWasCalled(spy);
            }
        },

        {
            name:'Can get value of inputNode',
            runTest:function () {

                var field = new TextField();

                field.inputNode.value = 'test';

                doh.assertEqual(field.getValue(), 'test');
            }
        },

        {
            name:'Can set original value',
            runTest:function () {

                var field = new TextField();

                field.setValue('test', true);

                doh.assertEqual(field.originalValue, 'test');
            }
        },

        {
            name:'Can set input value',
            runTest:function () {

                var field = new TextField();

                field.setValue('test');

                doh.assertEqual(field.inputNode.value, 'test');
            }
        },

        {
            name:'Can clear value as initial value',
            runTest:function () {

                var field = new TextField();

                var spy = doh.spyOn(field, 'setValue');

                field.clearValue();

                doh.assertWasCalledWith(spy, ['', true]);
            }
        },
        {
            name:'Can clear value as dirty value',
            runTest:function () {

                var field = new TextField();

                var spy = doh.spyOn(field, 'setValue');

                field.clearValue(true);

                doh.assertWasCalledWith(spy, ['', false]);
            }
        },

        {
            name:'Can determine if field is dirty (orig value not equal actual value)',
            runTest:function () {

                var field = new TextField();

                doh.spyOn(field, 'getValue').andReturn('dirty');

                field.originalValue = 'orig';

                doh.assertEqual(field.isDirty(), true);
            }
        },
        {
            name:'Can determine if field is clean (orig value equal actual value)',
            runTest:function () {

                var field = new TextField();

                doh.spyOn(field, 'getValue').andReturn('clean');

                field.originalValue = 'clean';

                doh.assertEqual(field.isDirty(), false);
            }
        },

        {
            name:'Can call onChange when value check fails in the notification handler',
            runTest:function () {

                var field = new TextField();

                field.previousValue = 'test';

                doh.spyOn(field, 'getValue').andReturn('changed');
                var spy = doh.spyOn(field, 'onChange');

                field.onNotificationTrigger();

                doh.assertWasCalledWith(spy, ['changed', field]);
            }
        },

        {
            name:'Can set previous value to new value when value check fails in the notification handler',
            runTest:function () {

                var field = new TextField();

                field.previousValue = 'test';

                doh.spyOn(field, 'getValue').andReturn('changed');

                field.onNotificationTrigger();

                doh.assertEqual(field.previousValue, 'changed');
            }
        },

        {
            name:'Can add error class if validate fails in onValidation handler',
            runTest:function () {

                var field = new TextField();

                field.containerNode = document.createElement('div');

                doh.spyOn(field, 'validate').andReturn(true);

                field.onValidationTrigger();

                doh.assertEqual(domClass.contains(field.containerNode, 'row-error'), true);
            }
        },

        {
            name:'Can remove error class if validate succeeds in onValidation handler',
            runTest:function () {

                var field = new TextField();

                field.containerNode = document.createElement('div');
                domClass.add(field.containerNode, 'row-error');

                doh.spyOn(field, 'validate').andReturn(false);

                field.onValidationTrigger();

                doh.assertEqual(domClass.contains(field.containerNode, 'row-error'), false);
            }
        },

        {
            name:'Can change the input type based upon type property at construction',
            runTest:function () {

                var field = new TextField({
                    inputType:'test'
                });

                doh.assertEqual(domAttr.get(field.inputNode, 'type'), 'test');
            }
        },

        {
            name:'Can not set a clear button if enable clear button is false',
            runTest:function () {

                var field = new TextField({
                    enableClearButton:false
                });

                doh.assertEqual(query('> button', field.domNode).length, 0);
                doh.assertEqual(field.clearNode, null);
            }
        }

    ]);
});
