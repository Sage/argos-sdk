define('spec/GroupedList.spec', [
    'dojo/query',
    'dojo/dom-class',
    'dojo/store/Memory',
    'argos/GroupedList'
], function(
    query,
    domClass,
    Memory,
    GroupedList
) {
return describe('argos.GroupedList', function() {

    var list = new GroupedList();
    beforeEach(function() {
        list.destroy();
        list = new GroupedList();
    });


    it('Can return base group tag', function() {
        var group = list.getGroupForItem(null);

        expect(group.tag).toEqual(1);
        expect(group.title).toEqual('Default');
    });

    it('Can add is-collapsed class to untoggled node', function() {
        var node = document.createElement('div');
        list.toggleGroup({fake:'Event'}, node);

        expect(domClass.contains(node, 'is-collapsed')).toEqual(true);
    });
    it('Can remove collapsed class from toggled node', function() {
        var node = document.createElement('div');

        domClass.add(node, 'is-collapsed');

        list.toggleGroup({fake:'Event'}, node);

        expect(domClass.contains(node, 'is-collapsed')).toEqual(false);
    });

    it('Can reset _currentGroup on clear', function() {
        list._currentGroup = 'test';
        list.clear();

        expect(list._currentGroup).toEqual(null);
    });

    it('Can reset _currentGroupNode on clear', function() {
        list._currentGroupNode = 'test';
        list.clear();

        expect(list._currentGroupNode).toEqual(null);
    });


});
});
