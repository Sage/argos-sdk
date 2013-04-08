define('Fields/DecimalFieldTests', ['dojo/query','dojo/dom-attr','dojo/dom-class','Sage/Platform/Mobile/Fields/DecimalField'], function(query, domAttr, domClass, DecimalField) {
return describe('Sage.Platform.Mobile.Fields.DecimalField', function() {

    it('Can rouund to 2 decimal places', function() {
        var field = new DecimalField();
        var value = 0.001
        field.setValue(value);
        expect(field.getValue()).toEqual(0.00);
    });
   
    it('Can rouund to 2 decimal places down', function() {
        var field = new DecimalField();
        var value = 0.554
        field.setValue(value);
        expect(field.getValue()).toEqual(0.55);
    });
    it('Can rouund to 2 decimal places up', function() {
        var field = new DecimalField();
        var value = 0.555;
        field.setValue(value);
        expect(field.getValue()).toEqual(0.56);
    });
    it('Can rouund to 2 decimal places down', function() {
        var field = new DecimalField();
        var value = 0.554;
        field.setValue(value);
        expect(field.getValue()).toEqual(0.55);
    });
    it('Can rouund to 0 decimal places up', function() {
        var field = new DecimalField();
        var value = 0.55;
        field.precision = 0;
        field.setValue(value);
        expect(field.getValue()).toEqual(1);
    });
    it('Can rouund to 0 decimal places up', function() {
        var field = new DecimalField();
        var value = 1000.55;
        field.precision = 0;
        field.setValue(value);
        expect(field.getValue()).toEqual(1001.00);
    });
    it('Can rouund to 0 decimal places down', function() {
        var field = new DecimalField();
        var value = 1000.25;
        field.precision = 0;
        field.setValue(value);
        expect(field.getValue()).toEqual(1000.00);
    });
    it('Can rouund to 1 decimal places up', function() {
        var field = new DecimalField();
        var value = 0.55;
        field.precision = 1;
        field.setValue(value);
        expect(field.getValue()).toEqual(0.6);
    });
    it('Can rouund to 1 decimal places up', function() {
        var field = new DecimalField();
        var value = 1000.55;
        field.precision = 1;
        field.setValue(value);
        expect(field.getValue()).toEqual(1000.6);
    });
    it('Can rouund to 1 decimal places down', function() {
        var field = new DecimalField();
        var value = 1000.24;
        field.precision = 1;
        field.setValue(value);
        expect(field.getValue()).toEqual(1000.2);
    });
    it('Can rouund to 3 decimal places up', function() {
        var field = new DecimalField();
        var value = 0.5568;
        field.precision = 3;
        field.setValue(value);
        expect(field.getValue()).toEqual(0.557);
    });
    it('Can rouund to 3 decimal places up', function() {
        var field = new DecimalField();
        var value = 1000.5559;
        field.precision = 3;
        field.setValue(value);
        expect(field.getValue()).toEqual(1000.556);
    });
    it('Can rouund to 3 decimal places down', function() {
        var field = new DecimalField();
        var value = 1000.24;
        field.precision = 3;
        field.setValue(value);
        expect(field.getValue()).toEqual(1000.240);
    });
    it('Can rouund to 3 decimal places down', function() {
        var field = new DecimalField();
        var value = 1000.2434;
        field.precision = 3;
        field.setValue(value);
        expect(field.getValue()).toEqual(1000.243);
    });
    it('Can rouund to invaild  decimal places defaults to culture', function() {
        var field = new DecimalField();
        var value = 1000.2434;
        field.precision = null;
        field.setValue(value);
        expect(field.getValue()).toEqual(1000.24);
    });
    it('Can format invalid number of precision 0', function() {
        var field = new DecimalField();
        var value = null;
        field.precision = 0;
        field.setValue(value);
        expect(field.getValue()).toEqual(0);
    });
    it('Can format invalid number of precision 0', function() {
        var field = new DecimalField();
        var value = null;
        field.setValue(value);
        expect(field.getValue()).toEqual(0);
    });
});
});