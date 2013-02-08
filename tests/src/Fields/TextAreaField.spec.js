define('spec/Fields/TextAreaField.spec', ['dojo/query','argos/Fields/TextAreaField'], function(query, TextArea) {
return describe('argos.Fields.TextArea', function() {

    it('Can default to 4 rows', function() {
        var field = new TextArea();

        expect(field.rows).toEqual(4);
    });

    it('Can default to no clear button', function() {
        var field = new TextArea();

        expect(field.enableClearButton).toEqual(false);
        expect(query('> button', field.domNode).length).toEqual(0);
        expect(field.clearNode).toEqual(null);
    });

});
});