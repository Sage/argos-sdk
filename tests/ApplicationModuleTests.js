define('ApplicationModuleTests', ['Sage/Platform/Mobile/ApplicationModule'], function(ApplicationModule) {
return describe('Sage.Platform.Mobile.ApplicationModule', function() {

    it('Can set connects to empty array on construct', function() {
        var module = new ApplicationModule();
        expect(module._connects.length).toEqual(0);
    });



});
});