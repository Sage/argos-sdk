define('spec/_SDataListMixin.spec', ['dojo/query','dojo/dom-class','argos/_SDataListMixin'], function(query, domClass, _SDataListMixin) {
    return describe('argos._SDataListMixin', function() {

        it('Can return a preset query when hash tag is matched', function() {
            var mixin = new _SDataListMixin();
            mixin.hashTags = [{
                key: 'test',
                tag: 'test',
                query: 'query'
            }];

            expect(mixin.formatHashTagQuery('#test')).toEqual('(query)');
        });

        it('Can return a dynamic query when hash tag is matched', function() {
            var mixin = new _SDataListMixin();
            mixin.hashTags = [{
                key: 'test',
                tag: 'test',
                query: function() { return 'query'; }
            }];

            expect(mixin.hashTagSearch('#test')).toEqual('(query)');
        });


        it('Can return multiple preset queries when all are hash tag matches', function() {
            var mixin = new _SDataListMixin();
            mixin.hashTags = [{
                key: 'test',
                tag: 'test',
                query: 'query'
            }, {
                key: 'test1',
                tag: 'test1',
                query: 'query1'
            }];

            expect(mixin.hashTagSearch('#test #test1')).toEqual('(query) and (query1)');
        });

        it('Can return a preset query when hash tag is matched and with a search term added', function() {
                var mixin = new _SDataListMixin();
                mixin.hashTags = [{
                        key: 'test',
                        tag: 'test',
                        query: 'query'
                    }];
            spyOn(searchWidget, 'formatSearchQuery').andCallThrough();

            expect(searchWidget.hashTagSearch('#test john')).toEqual('(query) and (where=john)');
            expect(searchWidget.formatSearchQuery).toHaveBeenCalledWith('john');
        });

        it('Can execute search, no hashes just search term', function() {
            var searchWidget = new SearchWidget({
                formatSearchQuery: function(val) { return 'where='+val;}
            });
            searchWidget.queryNode.value = 'search';


            spyOn(searchWidget, 'formatSearchQuery').andCallThrough();
            spyOn(searchWidget, 'onSearchExpression');

            searchWidget.search();

            expect(searchWidget.formatSearchQuery).toHaveBeenCalledWith('search');
            expect(searchWidget.onSearchExpression).toHaveBeenCalledWith('where=search', searchWidget);
        });
    });
});