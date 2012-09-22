define('spec/SearchWidget.spec', ['dojo/query','dojo/dom-class','argos/SearchWidget'], function(query, domClass, SearchWidget) {
    return describe('argos.SearchWidget', function() {

        it('Can remove active class on clear', function() {
            var searchWidget = new SearchWidget();

            domClass.add(searchWidget.domNode, 'search-active');
            searchWidget.clear();

            expect(domClass.contains(searchWidget.domNode, 'search-active')).toEqual(false);
        });
        it('Can empty search value on clear', function() {
            var searchWidget = new SearchWidget();

            var inputNode = query('input', searchWidget.domNode)[0];
            inputNode.value = 'test';

            searchWidget.clear();

            expect(inputNode.value).toEqual('');
        });

        it('Can remove search active state on blur when no search term is typed in', function(){
            var searchWidget = new SearchWidget();
            domClass.add(searchWidget.domNode, 'search-active');

            searchWidget._onBlur();

            expect(domClass.contains(searchWidget.domNode, 'search-active')).toEqual(false);
        });
        it('Can leave search active state on blur when search term is still typed in', function(){
            var searchWidget = new SearchWidget();
            domClass.add(searchWidget.domNode, 'search-active');
            searchWidget.queryNode.value = 'test';

            searchWidget._onBlur();

            expect(domClass.contains(searchWidget.domNode, 'search-active')).toEqual(true);
        });

        it('Adds search-active state on focus', function(){
            var searchWidget = new SearchWidget();
            searchWidget._onFocus();

            expect(domClass.contains(searchWidget.domNode, 'search-active')).toEqual(true);
        });

    });
});