define('Fields/PhoneFieldTests', ['Sage/Platform/Mobile/Fields/PhoneField'], function(PhoneField) {
return describe('Sage.Platform.Mobile.Fields.PhoneField', function() {

    it('Can call format value on blur', function() {
        var field = new PhoneField();

        spyOn(field, 'formatNumberForDisplay');

        field._onBlur();

        expect(field.formatNumberForDisplay).toHaveBeenCalled();
    });
    it('Can set formatted value to input node on blur', function() {
        var field = new PhoneField();

        spyOn(field, 'formatNumberForDisplay').andReturn('test');

        field._onBlur();

        expect(field.inputNode.value).toEqual('test');
    });

    it('Can strip symbols characters when first character is not +', function() {
        var field = new PhoneField();

        field.inputNode.value = '01`~!@#$%^&*()-_=+[]{}\\|;:\'",<.>/?23';

        expect(field.getValue()).toEqual('0123');
    });
    it('Can strip letter characters (non x) when first character is not +', function() {
        var field = new PhoneField();

        field.inputNode.value = 'x01abcdefghijklmnopqrstuvwyz23';

        expect(field.getValue()).toEqual('x0123');
    });
    it('Can leave symbols characters when first character is +', function() {
        var field = new PhoneField();

        field.inputNode.value = '+01_-~~23';

        expect(field.getValue()).toEqual('+01_-~~23');
    });
    it('Can leave letter characters when first character is +', function() {
        var field = new PhoneField();

        field.inputNode.value = '+01abc23';

        expect(field.getValue()).toEqual('+01abc23');
    });

    it('Can format value on setValue', function() {
        var field = new PhoneField();

        spyOn(field, 'formatNumberForDisplay');

        field.setValue('test');

        expect(field.formatNumberForDisplay).toHaveBeenCalled();
    });

    it('Can set formatted value to input node on setValue', function() {
        var field = new PhoneField();

        spyOn(field, 'formatNumberForDisplay').andReturn('test');

        field.setValue('test');

        expect(field.inputNode.value).toEqual('test');
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





});
});