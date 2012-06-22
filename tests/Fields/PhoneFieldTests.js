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

    it('Can skip formatting when number starts with +', function() {
        var field = new PhoneField();

        var testNumber = '+100-100-1000';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual(testNumber);
    });
    it('Can format (6) nnnnnn to nnn-nnn', function() {
        var field = new PhoneField();

        var testNumber = '123456';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual('123-456');
    });
    it('Can format (7) nnnnnnn to nnn-nnnn', function() {
        var field = new PhoneField();

        var testNumber = '1234567';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual('123-4567');
    });
    it('Can format (8) nnnnnnnn to (nnn)-nnn-nn', function() {
        var field = new PhoneField();

        var testNumber = '12345678';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual('(123)-456-78');
    });
    it('Can format (9) nnnnnnnnn to (nnn)-nnn-nnn', function() {
        var field = new PhoneField();

        var testNumber = '123456789';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual('(123)-456-789');
    });
    it('Can format (10) nnnnnnnnnn to (nnn)-nnn-nnnn', function() {
        var field = new PhoneField();

        var testNumber = '1234567890';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual('(123)-456-7890');
    });
    it('Can return 11+ digits unformated', function() {
        var field = new PhoneField();

        var testNumber = '123456789011';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual('123456789011');
    });
    it('Can format (8x) nnnnnnnnxxx to (nnn)-nnn-nnxxx', function() {
        var field = new PhoneField();

        var testNumber = '12345678xxx';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual('(123)-456-78xxx');
    });
    it('Can format (9x) nnnnnnnnnxxxx to (nnn)-nnn-nnnxxxx', function() {
        var field = new PhoneField();

        var testNumber = '123456789xxx';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual('(123)-456-789xxx');
    });
    it('Can format (10x) nnnnnnnnnnxxx to (nnn)-nnn-nnnnxxx', function() {
        var field = new PhoneField();

        var testNumber = '1234567890xxx';
        var cleaned = field.formatNumberForDisplay(testNumber);

        expect(cleaned).toEqual('(123)-456-7890xxx');
    });
});
});