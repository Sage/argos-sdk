define([
    'doh/runner',
    'dojo/query',
    'argos/Fields/TextAreaField'
], function(
    doh,
    query,
    TextArea
) {
    doh.register('argos-tests.src.Fields.TextArea', [
        {
            name: 'Can default to 4 rows',
            runTest: function() {

                var field = new TextArea();

                doh.assertEqual(field.rows, 4);
            }
        },{
            name: 'Can default to no clear button',
            runTest: function() {
                var field = new TextArea();

                doh.assertEqual(field.enableClearButton, false);
                doh.assertEqual(query('> button', field.domNode).length, 0);
                doh.assertEqual(field.clearNode, null);

            }
        }
    ]);
});