define('FieldManagerTests', ['dojo/_base/lang','argos/FieldManager'], function(lang, FieldManager) {
return describe('Argos.FieldManager', function() {

    it('Can register an item', function() {
        FieldManager.register('test', 'item');
        expect(FieldManager.types['test']).toEqual('item');
    });

    it('Can get an item', function() {
        FieldManager.types['testget'] = 'itemget';
        expect(FieldManager.get('testget')).toEqual('itemget');
    });
});
});