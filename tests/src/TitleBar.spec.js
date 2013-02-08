define('spec/TitleBar.spec', ['dojo/query', 'dojo/dom-construct', 'dojo/dom-class', 'argos/TitleBar'], function(query, domConstruct, domClass, TitleBar) {
return describe('argos.TitleBar', function() {

    it('Can clear counts of left/right items on clear', function() {
        var bar = new TitleBar();
        bar._count = {left: 6, right: 3};

        bar.clear();

        expect(bar._count.left).toEqual(0);
        expect(bar._count.right).toEqual(0);
    });

});
});