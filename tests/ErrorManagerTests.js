define('ErrorManagerTests', ['Sage/Platform/Mobile/ErrorManager'], function(ErrorManager) {
return describe('Sage.Platform.Mobile.ErrorManager', function() {

    it('Can set undefined properties to undefined string', function() {
        var obj = {
            test: undefined
        };

        expect(ErrorManager.serializeValues(obj)['test']).toEqual('undefined');
    });
    it('Can remove function properties', function() {
        var obj = {
            test: function() {}
        };

        expect(ErrorManager.serializeValues(obj)['test']).toEqual(undefined);
    });
    it('Can set null properties to null string', function() {
        var obj = {
            test: null
        };

        expect(ErrorManager.serializeValues(obj)['test']).toEqual('null');
    });
    it('Can set the scope property to its predefined scope text', function() {
        var obj = {
            scope: {}
        };

        expect(ErrorManager.serializeValues(obj)['scope']).toEqual(ErrorManager.scopeSaveText);
    });

    it('Can remove', function() {
        var obj = {
            scope: {}
        };

        expect(ErrorManager.serializeValues(obj)['scope']).toEqual(ErrorManager.scopeSaveText);
    });




});
});
