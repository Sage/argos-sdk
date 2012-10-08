define('spec/_OfflineCache.spec', [
    'dojo/_base/lang',
    'argos/_OfflineCache'
], function(
    lang,
    _OfflineCache
) {
return describe('argos._OfflineCache', function() {
    var cache = _OfflineCache;

    /**
     * _OfflineCache.startup
     */
    it('Can call create SQL database on startup when SQL is the detected type', function() {
        cache._databaseType = 'sql';

        spyOn(cache, '_createSQLDatabase');

        cache.startup();
        expect(cache._createSQLDatabase).toHaveBeenCalled();
    });
    it('Can successfully create a sql database (requires WebSQL compat browser)', function() {

        cache.startup();
        waitsFor(function() {
            return cache._database !== null;
        }, "Creating SQL database", 5000);

        expect(cache._database).not.toBe(null);
    });

    /**
     * _OfflineCache.splitResources
     */
    it('Can split a single nested related entity into the proper related structure', function() {
        var entityName = 'Test';
        var entry = {
            Name: 'Test',
            Count: 1,
            innerKind: {
                Name: 'Inner',
                Count: 2
            }
        };
        var expected = {
            entityName: entityName,
            entry: {
                Name: 'Test',
                Count: 1
            },
            related: [
                {
                    entityName: 'innerKind',
                    entry: {
                        Name: 'Inner',
                        Count: 2
                    },
                    related: []
                }
            ]
        };

        expect(cache.splitResources(entityName, entry)).toEqual(expected);
    });
    it('Can split a doubly nested related entity into the proper related structure', function() {
        var entityName = 'Test';
        var entry = {
            Name: 'Test',
            Count: 1,
            innerKind: {
                Name: 'Inner',
                Count: 2,
                thirdKind: {
                    Name: 'Inner2',
                    Count: 3
                }
            }
        };
        var expected = {
            entityName: entityName,
            entry: {
                Name: 'Test',
                Count: 1
            },
            related: [
                {
                    entityName: 'innerKind',
                    entry: {
                        Name: 'Inner',
                        Count: 2
                    },
                    related: [
                        {
                            entityName: 'thirdKind',
                            entry: {
                                Name: 'Inner2',
                                Count: 3
                            },
                            related: []
                        }
                    ]
                }
            ]
        };

        expect(cache.splitResources(entityName, entry)).toEqual(expected);
    });
    it('Can split sibling nested related entities into the proper related structure', function() {
        var entityName = 'Test';
        var entry = {
            Name: 'Test',
            Count: 1,
            innerKind: {
                Name: 'Inner',
                Count: 2
            },
            siblingKind: {
                Name: 'Sibling',
                Count: 2
            }
        };
        var expected = {
            entityName: entityName,
            entry: {
                Name: 'Test',
                Count: 1
            },
            related: [
                {
                    entityName: 'innerKind',
                    entry: {
                        Name: 'Inner',
                        Count: 2
                    },
                    related: []
                },
                {
                    entityName: 'siblingKind',
                    entry: {
                        Name: 'Sibling',
                        Count: 2
                    },
                    related: []
                }
            ]
        };

        expect(cache.splitResources(entityName, entry)).toEqual(expected);
    });




});
});