define('spec/ApplicationModule.spec', ['argos/ApplicationModule'], function(ApplicationModule) {
return describe('argos.ApplicationModule', function() {

    it('Can register a view to the set application', function() {
        var module = new ApplicationModule();

        // mock the scene
        module.application = {
            scene: {
                registerView: function() {}
            }
        };

        spyOn(module.application.scene, 'registerView');

        module.registerView({id: 'view_id'});

        expect(module.application.scene.registerView)
            .toHaveBeenCalledWith('view_id',{id: 'view_id'});
    });

    it('Can register a customization to the set application', function() {
        var module = new ApplicationModule();

        module.application = {
            registerCustomization: function() {}
        };

        spyOn(module.application, 'registerCustomization');

        module.registerCustomization('test_set', 'test_id', 'test_spec');

        expect(module.application.registerCustomization)
            .toHaveBeenCalledWith('test_set', 'test_id', 'test_spec');
    });

    it('Calls load customizations on startup', function() {
        var module = new ApplicationModule();

        spyOn(module, 'loadCustomizations');

        module.startup();

        expect(module.loadCustomizations).toHaveBeenCalled();
    });

    it('Calls load views on startup', function() {
        var module = new ApplicationModule();

        spyOn(module, 'loadViews');

        module.startup();

        expect(module.loadViews).toHaveBeenCalled();
    });

});
});