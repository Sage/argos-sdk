define('Fields/SignatureFieldTests', ['Argos/Fields/SignatureField'], function(Signature) {
return describe('Argos.Fields.SignatureField', function() {

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