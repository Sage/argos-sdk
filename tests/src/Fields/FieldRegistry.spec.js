define('spec/Fields/FieldRegistry.spec', ['dojo/_base/lang','argos/Fields/FieldRegistry'], function(lang, FieldRegistry) {
return describe('argos.FieldRegistry', function() {

    it('Can register an item', function() {
        var ctor = function() { return 'ctor'; };
        FieldRegistry.register('test', ctor);
        expect(FieldRegistry.fromType['test']).toEqual(ctor);
    });

    it('Can get an item', function() {
        FieldRegistry.fromType['testget'] = 'itemget';
        expect(FieldRegistry.getFieldFor('testget', null)).toEqual('itemget');
    });
});
});