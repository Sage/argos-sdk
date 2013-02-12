define([
    'doh/runner',
    'argos/format',
    'argos/Fields/PhoneField'
], function (
    doh,
    format,
    PhoneField
) {
    doh.register('argos-tests.src.Fields.PhoneField', [

        {
            name:'Can call format value on blur',
            runTest:function () {

                var field = new PhoneField();

                var spy = doh.spyOn(format, 'phone');

                field._onBlur();

                doh.assertWasCalled(spy);
            }
        },
        {
            name:'Can set formatted value to input node on blur',
            runTest:function () {

                var field = new PhoneField();

                doh.spyOn(format, 'phone').andReturn('test');

                field._onBlur();

                doh.assertEqual(field.inputNode.value, 'test');
            }
        },
        {
            name:'Can strip symbols characters when first character is not +',
            runTest:function () {

                var field = new PhoneField();

                field.inputNode.value = '01`~!@#$%^&*()-_=+[]{}\\|;:\'",<.>/?23';

                doh.assertEqual(field.getValue(), '0123');
            }
        },
        {
            name:'Can leave symbols characters when first character is +',
            runTest:function () {

                var field = new PhoneField();

                field.inputNode.value = '+01_-~~23';

                doh.assertEqual(field.getValue(), '+01_-~~23');
            }
        },
        {
            name:'Can set original value on setValue with true flag',
            runTest:function () {

                var field = new PhoneField();

                field.setValue('test', true);

                doh.assertEqual(field.originalValue, 'test');
            }
        },
        {
            name:'Can not set original value on setValue with false flag',
            runTest:function () {

                var field = new PhoneField();

                field.setValue('test', false);

                doh.assertEqual(field.originalValue, null);
            }
        },
        {
            name:'Can clear previous value on setValue',
            runTest:function () {

                var field = new PhoneField();

                field.previousValue = 'test';

                field.setValue('test', false);

                doh.assertEqual(field.previousValue, false);
            }
        },
        {
            name:'Can convert A-Z chars to their phone number equivalents',
            runTest:function () {

                var field = new PhoneField();

                field.inputNode.value = 'ABCDEFHGIJKLMNOPQRSTUVWXYZ';

                doh.assertEqual(field.getValue(), '22233344455566677778889999');
            }
        },
        {
            name:'Can convert A-Z chars to their phone number equivalents (basic example)',
            runTest:function () {

                var field = new PhoneField();

                field.inputNode.value = '1800CALLJEFF';

                doh.assertEqual(field.getValue(), '180022555333');
            }
        }
    ]);
});