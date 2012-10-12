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
                    entityName: 'Test.innerKind',
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
                    entityName: 'Test.innerKind',
                    entry: {
                        Name: 'Inner',
                        Count: 2
                    },
                    related: [
                        {
                            entityName: 'Test.innerKind.thirdKind',
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
                    entityName: 'Test.innerKind',
                    entry: {
                        Name: 'Inner',
                        Count: 2
                    },
                    related: []
                },
                {
                    entityName: 'Test.siblingKind',
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

    /**
     * _OfflineCache.formatValueByType
     */
    it('Can format a string value for sqllite by returning it directly (no modification)', function() {
        var value = 'Test';
        var expected = 'Test';

        expect(cache.formatValueByType(value)).toEqual(expected);
    });
    it('Can format a number value for sqllite by returning it directly (no modification)', function() {
        var value = 5;
        var expected = 5;

        expect(cache.formatValueByType(value)).toEqual(expected);
    });
    it('Can format a true boolean value for sqllite by returning 1 for true', function() {
        var value = true;
        var expected = 1;

        expect(cache.formatValueByType(value)).toEqual(expected);
    });
    it('Can format a false boolean value for sqllite by returning 0 for false', function() {
        var value = false;
        var expected = 0;

        expect(cache.formatValueByType(value)).toEqual(expected);
    });
    it('Can format a date value for sqllite by returning the # of ms since 1970 (unix epoch)', function() {
        var value = new Date(1349980826209); // 2012-11-10 18:40:26 UTC (-00:00)
        var expected = 1349980826209;

        expect(cache.formatValueByType(value)).toEqual(expected);
    });

    /**
     * _OfflineCache.resolveType
     */
    it('Can resolve a string to the sqllite type "TEXT', function() {
        var value = 'Test';
        var sqlType = 'TEXT';
        expect(cache.resolveType(value)).toEqual(sqlType);
    });
    it('Can resolve a number to the sqllite type "REAL', function() {
        var value = 5;
        var sqlType = 'REAL';
        expect(cache.resolveType(value)).toEqual(sqlType);
    });
    it('Can resolve a boolean to the sqllite type "INTEGER', function() {
        var value = true;
        var sqlType = 'INTEGER';
        expect(cache.resolveType(value)).toEqual(sqlType);
    });
    it('Can resolve a date to the sqllite type "INTEGER', function() {
        var value = true;
        var sqlType = 'INTEGER';
        expect(cache.resolveType(value)).toEqual(sqlType);
    });

    /**
     * _OfflineCache.createColumnDefinition
     */
    it('Can create websql column definition for a single string', function() {
        var entry = { value: 'Test' };
        var key = '001';

        var definition = {
            key: '001',
            createString: '"$key" TEXT PRIMARY KEY, "value" TEXT',
            updateString: '"value" = Test',
            columnNames: ['"$key"', '"value"'],
            values: ['001', 'Test']
        };
        expect(cache.createColumnDefinition(entry, key)).toEqual(definition);
    });
    it('Can create websql column definition for a single number', function() {
        var entry = { value: 5 };
        var key = '001';

        var definition = {
            key: '001',
            createString: '"$key" TEXT PRIMARY KEY, "value" REAL',
            updateString: '"value" = 5',
            columnNames: ['"$key"', '"value"'],
            values: ['001', 5]
        };
        expect(cache.createColumnDefinition(entry, key)).toEqual(definition);
    });
    it('Can create websql column definition for a single boolean', function() {
        var entry = { value: true };
        var key = '001';

        var definition = {
            key: '001',
            createString: '"$key" TEXT PRIMARY KEY, "value" INTEGER',
            updateString: '"value" = 1',
            columnNames: ['"$key"', '"value"'],
            values: ['001', 1]
        };
        expect(cache.createColumnDefinition(entry, key)).toEqual(definition);
    });
    it('Can create websql column definition for a single date', function() {
        var entry = { value: new Date(1349980826209) };
        var key = '001';

        var definition = {
            key: '001',
            createString: '"$key" TEXT PRIMARY KEY, "value" INTEGER',
            updateString: '"value" = 1349980826209',
            columnNames: ['"$key"', '"value"'],
            values: ['001', 1349980826209]
        };
        expect(cache.createColumnDefinition(entry, key)).toEqual(definition);
    });
    it('Can create websql column definition for a multiple mixed entry', function() {
        var entry = {
            value: 'Testing',
            count: 3,
            success: true,
            stamp: new Date(1349980826209)
        };
        var key = '001';

        var definition = {
            key: '001',
            createString: '"$key" TEXT PRIMARY KEY, "value" TEXT, "count" REAL, "success" INTEGER, "stamp" INTEGER',
            updateString: '"value" = Testing, "count" = 3, "success" = 1, "stamp" = 1349980826209',
            columnNames: ['"$key"', '"value"', '"count"', '"success"', '"stamp"'],
            values: ['001', 'Testing', 3, 1, 1349980826209]
        };
        expect(cache.createColumnDefinition(entry, key)).toEqual(definition);
    });





});
});