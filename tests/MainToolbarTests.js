define('MainToolbarTests', ['dojo/query', 'dojo/dom-construct', 'dojo/dom-class', 'Sage/Platform/Mobile/MainToolbar'], function(query, domConstruct, domClass, MainToolbar) {
return describe('Sage.Platform.Mobile.MainToolbar', function() {

    it('Can clear right toolbar items', function() {
        var bar = new MainToolbar();

        domConstruct.place('<div class="toolButton-right" data-action="test"></div>', bar.domNode, 'last');

        bar.clear();

        expect(query('> [data-action], .toolButton-right', bar.domNode).length).toEqual(0);
    });

    it('Can update size class when showing tools', function() {
        var bar = new MainToolbar();

        bar.showTools([
            {
                id: 'test'
            },
            {
                id: 'test1'
            }
        ]);

        expect(domClass.contains(bar.domNode, 'toolbar-size-2')).toEqual(true);
    });

    it('Can add left side button toolbar item', function() {
        var bar = new MainToolbar();

        bar.showTools([
            {
                id: 'test',
                side: 'left'
            }
        ]);

        var tool = query('> [data-action]', bar.domNode)[0];
        expect(domClass.contains(tool, 'toolButton-left')).toEqual(true);
    });

    it('Can add right side button toolbar item', function() {
        var bar = new MainToolbar();

        bar.showTools([
            {
                id: 'test',
                side: 'right'
            }
        ]);

        var tool = query('> [data-action]', bar.domNode)[0];
        expect(domClass.contains(tool, 'toolButton-right')).toEqual(true);
    });
});
});