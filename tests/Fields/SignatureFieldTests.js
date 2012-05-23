define('Fields/SignatureFieldTests', ['Sage/Platform/Mobile/Fields/SignatureField'], function(Signature) {
return describe('Sage.Platform.Mobile.Fields.SignatureField', function() {

    it('Can clear value', function() {
        var field = new Signature();

        spyOn(field, 'setValue');

        field.clearValue();

        expect(field.setValue).toHaveBeenCalledWith('', true);
    });

    it('Can return exact value for formatted value', function() {
        var field = new Signature();

        expect(field.formatValue('test')).toEqual('test');
    });


});
});