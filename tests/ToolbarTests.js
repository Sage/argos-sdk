define('ToolbarTests', [
    'dojo/dom-style',
    'dojo/dom-class',
    'Sage/Platform/Mobile/Toolbar'
], function(
    domStyle,
    domClass,
    Toolbar
) {
return describe('Sage.Platform.Mobile.Toolbar', function() {

    // mock of App
    window.App = {};
    window.App.hasAccessTo = jasmine.createSpy().andCallFake(function(val) {
        // for testing a rejected security call
        if (val == 'false')
            return false;
        else
            return val;
    });

    it('Can show toolbar', function() {
        var bar = new Toolbar();
        bar.show();
        expect(domStyle.get(bar.domNode, 'display')).toEqual('block');
    });

    it('Can hide toolbar', function() {
        var bar = new Toolbar();
        bar.hide();
        expect(domStyle.get(bar.domNode, 'display')).toEqual('none');
    });

    it('Can clear toolbar', function() {
        var bar = new Toolbar();

        bar.tools = {test: true};
        bar.enabled = false;

        bar.clear();

        expect(domClass.contains(bar.domNode, 'toolbar-disabled')).toEqual(false);
        expect(bar.enabled).toEqual(true);
        expect(bar.tools).toEqual({});
    });

    it('Can enable toolbar', function() {
        var bar = new Toolbar();
        bar.enable();
        expect(bar.enabled).toEqual(true);
    });

    it('Can disable toolbar', function() {
        var bar = new Toolbar();
        bar.disable();
        expect(bar.enabled).toEqual(false);
    });

    it('Can enable toolbar item', function() {
        var bar = new Toolbar();
        bar.tools = {
            test: {}
        };

        bar.enableTool('test');

        expect(bar.tools.test['enabled']).toEqual(true);
    });

    it('Can disable toolbar item', function() {
        var bar = new Toolbar();
        bar.tools = {
            test: {}
        };

        bar.disableTool('test');

        expect(bar.tools.test['enabled']).toEqual(false);
    });

    it('Can indicate toolbar item is busy', function() {
        var bar = new Toolbar();
        bar.tools = {
            test: {}
        };

        bar.indicateToolBusy('test');

        expect(bar.tools.test['busy']).toEqual(true);
    });

    it('Can clear toolbar item busy status', function() {
        var bar = new Toolbar();
        bar.tools = {
            test: {}
        };

        bar.clearToolBusy('test');

        expect(bar.tools.test['busy']).toEqual(false);
    });

    it('Can detect when a tool is enabled', function() {
        var bar = new Toolbar();
        bar.tools = {
            test: {
                enabled: true
            }
        };

        expect(bar.isToolEnabled('test')).toEqual(true);
    });

    it('Can detect when a tool is disabled', function() {
        var bar = new Toolbar();
        bar.tools = {
            test: {
                enabled: false
            }
        };

        expect(bar.isToolEnabled('test')).toEqual(false);
    });

    it('Can show tools, expect defaults', function() {
        var bar = new Toolbar();
        bar.showTools([
            {
                id: 'test'
            }
        ]);

        expect(bar.tools.test['enabled']).toEqual(true);
        expect(bar.tools.test['busy']).toEqual(false);
        expect(bar.tools.test['source'].id).toEqual('test');
    });
    it('Can show tools, enabled explicitly false', function() {
        var bar = new Toolbar();
        bar.showTools([
            {
                id: 'test',
                enabled: false
            }
        ]);

        expect(bar.tools.test['enabled']).toEqual(false);
        expect(bar.tools.test['busy']).toEqual(false);
        expect(bar.tools.test['source'].id).toEqual('test');
        expect(bar.tools.test['source'].enabled).toEqual(false);
    });
    it('Can show tools, with truthy security', function() {
        var bar = new Toolbar();
        bar.showTools([
            {
                id: 'test',
                security: true
            }
        ]);

        expect(App.hasAccessTo).toHaveBeenCalled();
        expect(bar.tools.test['enabled']).toEqual(true);
        expect(bar.tools.test['busy']).toEqual(false);
        expect(bar.tools.test['source'].id).toEqual('test');
        expect(bar.tools.test['source'].security).toEqual(true);
    });
    it('Can show tools, with falsey security', function() {
        var bar = new Toolbar();
        bar.showTools([
            {
                id: 'test',
                security: 'false'
            }
        ]);

        expect(App.hasAccessTo).toHaveBeenCalled();
        expect(bar.tools.test['enabled']).toEqual(false);
        expect(bar.tools.test['busy']).toEqual(false);
        expect(bar.tools.test['source'].id).toEqual('test');
        expect(bar.tools.test['source'].security).toEqual('false');
    });

});
});