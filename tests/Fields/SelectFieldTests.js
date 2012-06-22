define('Fields/SelectFieldTests', ['Sage/Platform/Mobile/Fields/SelectField'], function(SelectField) {
return describe('Sage.Platform.Mobile.Fields.SelectField', function() {

    it('Can default to no valueKeyProperty', function() {
        var field = new SelectField();

        expect(field.valueKeyProperty).toEqual(false);
    });
    it('Can default to no valueTextProperty', function() {
        var field = new SelectField();

        expect(field.valueTextProperty).toEqual(false);
    });

    it('Can set nav options to always hide search', function() {
        var field = new SelectField();

        spyOn(Sage.Platform.Mobile.Fields.SelectField.superclass, 'createNavigationOptions').andReturn({});

        var options = field.createNavigationOptions();

        expect(options['hideSearch']).toEqual(true);
    });
    it('Can set nav options to always disable actions', function() {
        var field = new SelectField();

        spyOn(Sage.Platform.Mobile.Fields.SelectField.superclass, 'createNavigationOptions').andReturn({});

        var options = field.createNavigationOptions();

        expect(options['enableActions']).toEqual(false);
    });
    it('Can set nav options to include fields data (non function)', function() {
        var field = new SelectField();

        spyOn(Sage.Platform.Mobile.Fields.SelectField.superclass, 'createNavigationOptions').andReturn({});

        field.data = 'test';

        var options = field.createNavigationOptions();

        expect(options['data']).toEqual('test');
    });
    it('Can set nav options to include fields data (as function)', function() {
        var field = new SelectField();

        spyOn(Sage.Platform.Mobile.Fields.SelectField.superclass, 'createNavigationOptions').andReturn({});

        field.data = function(){return 'test';};

        var options = field.createNavigationOptions();

        expect(options['data']).toEqual('test');
    });
});
});