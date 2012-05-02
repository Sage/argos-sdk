define('SearchWidgetTests', ['dojo/query','dojo/dom-class','Sage/Platform/Mobile/SearchWidget'], function(query, domClass, SearchWidget) {
    return describe('Sage.Platform.Mobile.SearchWidget', function() {

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

        it('Can return an unformatted query when custom matcher is matched', function() {
            var searchWidget = new SearchWidget();

            expect(searchWidget.customSearch('#!test')).toEqual('test');
        });

        it('Can return a preset query when hash tag is matched', function() {
            var searchWidget = new SearchWidget(
                {
                    hashTagQueries: [{
                        key: 'test',
                        tag: 'test',
                        query: 'query'
                    }]
                }
            );

            expect(searchWidget.hashTagSearch('#test')).toEqual('(query)');
        });

        it('Can return multiple preset queries when all are hash tag matches', function() {
            var searchWidget = new SearchWidget(
                {
                    hashTagQueries: [{
                        key: 'test',
                        tag: 'test',
                        query: 'query'
                    }, {
                        key: 'test1',
                        tag: 'test1',
                        query: 'query1'
                    }]
                }
            );

            expect(searchWidget.hashTagSearch('#test #test1')).toEqual('(query) and (query1)');
        });

        it('Can return a preset query when hash tag is matched and with a search term added', function() {
            var searchWidget = new SearchWidget(
                {
                    hashTagQueries: [{
                        key: 'test',
                        tag: 'test',
                        query: 'query'
                    }],
                    formatSearchQuery: function(val) {
                        return 'where='+val;
                    }
                }
            );
            spyOn(searchWidget, 'formatSearchQuery').andCallThrough();

            expect(searchWidget.hashTagSearch('#test john')).toEqual('(query) and (where=john)');
            expect(searchWidget.formatSearchQuery).toHaveBeenCalledWith('john');
        });

    });
});