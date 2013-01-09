define('spec/Fields/PhoneField.spec', ['argos/Fields/PhoneField'], function(PhoneField) {
return describe('argos.Fields.PhoneField', function() {

    it('Can call format value on blur', function() {
        var field = new PhoneField();

        spyOn(argos.format, 'phone');

        field._onBlur();

        expect(argos.format.phone).toHaveBeenCalled();
    });
    it('Can set formatted value to input node on blur', function() {
        var field = new PhoneField();

        spyOn(argos.format, 'phone').andReturn('test');

        field._onBlur();

        expect(field.inputNode.value).toEqual('test');
    });
    it('Can strip symbols characters when first character is not +', function() {
        var field = new PhoneField();

        field.inputNode.value = '01`~!@#$%^&*()-_=+[]{}\\|;:\'",<.>/?23';

        expect(field.getValue()).toEqual('0123');
    });
    it('Can leave symbols characters when first character is +', function() {
        var field = new PhoneField();

        field.inputNode.value = '+01_-~~23';

        expect(field.getValue()).toEqual('+01_-~~23');
    });
    it('Can set original value on setValue with true flag', function() {
        var field = new PhoneField();

        field.setValue('test', true);

        expect(field.originalValue).toEqual('test');
    });
    it('Can not set original value on setValue with false flag', function() {
        var field = new PhoneField();

        field.setValue('test', false);

        expect(field.originalValue).toEqual(null);
    });
    it('Can clear previous value on setValue', function() {
        var field = new PhoneField();

        field.previousValue = 'test';

        field.setValue('test', false);

        expect(field.previousValue).toEqual(false);
    });
    it('Can convert A-Z chars to their phone number equivalents', function() {
        var field = new PhoneField();

        field.inputNode.value = 'ABCDEFHGIJKLMNOPQRSTUVWXYZ';

        expect(field.getValue()).toEqual('22233344455566677778889999');
    });
    it('Can convert A-Z chars to their phone number equivalents (basic example)', function() {
        var field = new PhoneField();

        field.inputNode.value = '1800CALLJEFF';

        expect(field.getValue()).toEqual('180022555333');
    });
});
});