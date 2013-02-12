define([
    'doh/runner',
    'dojo/_base/lang',
    'argos/Fields/FieldRegistry'
], function(
    doh,
    lang,
    FieldRegistry
) {
    doh.register('argos-tests.src.Fields.FieldRegistry', [
        {
            name: 'Can register an item',
            runTest: function() {
                var ctor = function() { return 'ctor'; };

                FieldRegistry.register('test', ctor);

                doh.assertEqual(FieldRegistry.fromType['test'], ctor);
            }
        },{
            name: 'Can get an item',
            runTest: function() {

                FieldRegistry.fromType['testget'] = 'itemget';

                doh.assertEqual(FieldRegistry.getFieldFor('testget', null), 'itemget');
            }
        }
    ]);
});