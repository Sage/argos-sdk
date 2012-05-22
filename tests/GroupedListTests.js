define('GroupedListTests', ['dojo/query','dojo/dom-class','Sage/Platform/Mobile/GroupedList'], function(query, domClass, GroupedList) {
return describe('Sage.Platform.Mobile.GroupedList', function() {

    var list = new GroupedList();
    beforeEach(function() {
        list.destroy();
        list = new GroupedList();
    });


    it('Can return base group tag', function() {
        var group = list.getGroupForEntry(null);

        expect(group.tag).toEqual(1);
        expect(group.title).toEqual('Default');
    });

    it('Can added collapsed class to untoggled node', function() {
        var node = document.createElement('div');
        list.toggleGroup({$source: node});

        expect(domClass.contains(node, 'collapsed')).toEqual(true);
    });
    it('Can remove collapsed class from toggled node', function() {
        var node = document.createElement('div');

        domClass.add(node, 'collapsed');

        list.toggleGroup({$source: node});

        expect(domClass.contains(node, 'collapsed')).toEqual(false);
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

    it('Can construct list items from feed', function() {
        var feed = Resources.get('feeds/GroupListFeed.json');

        list.processFeed(feed);

        expect(query('> ul > li', list.contentNode).length).toEqual(feed['$totalResults']);
    });

    it('Can split list items into groups', function() {
        var feed = Resources.get('feeds/GroupListFeed.json');

        list.getGroupForEntry = function(entry) {
            return {
                tag: entry.view ? 0 : 1,
                title: entry.view ? 'Views' : 'Actions'
            }
        };

        list.processFeed(feed);

        expect(query('> ul', list.contentNode).length).toEqual(2);
    });


});
});
