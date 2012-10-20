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

        spyOn(cache, '_createSQLDatabase').andCallThrough();

        cache.startup();
        expect(cache._createSQLDatabase).toHaveBeenCalled();
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

        expect(cache._splitSQLResources(entityName, entry)).toEqual(expected);
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

        expect(cache._splitSQLResources(entityName, entry)).toEqual(expected);
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

        expect(cache._splitSQLResources(entityName, entry)).toEqual(expected);
    });

    /**
     * _OfflineCache.formatSQLValueByType
     */
    it('Can format a string value for sqllite by returning it directly (no modification)', function() {
        var value = 'Test';
        var expected = 'Test';

        expect(cache.formatSQLValueByType(value)).toEqual(expected);
    });
    it('Can format a number value for sqllite by returning it directly (no modification)', function() {
        var value = 5;
        var expected = 5;

        expect(cache.formatSQLValueByType(value)).toEqual(expected);
    });
    it('Can format a true boolean value for sqllite by returning 1 for true', function() {
        var value = true;
        var expected = 1;

        expect(cache.formatSQLValueByType(value)).toEqual(expected);
    });
    it('Can format a false boolean value for sqllite by returning 0 for false', function() {
        var value = false;
        var expected = 0;

        expect(cache.formatSQLValueByType(value)).toEqual(expected);
    });
    it('Can format a date value for sqllite by returning the # of ms since 1970 (unix epoch)', function() {
        var value = new Date(1349980826209); // 2012-11-10 18:40:26 UTC (-00:00)
        var expected = 1349980826209;

        expect(cache.formatSQLValueByType(value)).toEqual(expected);
    });
    it('Can format an array value for sqllite by json stringifying it', function() {
        var value = ["Chicken", "Turkey", "Pasta", 10, true];
        var expected = '["Chicken","Turkey","Pasta",10,true]';

        expect(cache.formatSQLValueByType(value)).toEqual(expected);
    });


    /**
     * _OfflineCache.resolveSQLType
     */
    it('Can resolve a string to the sqllite type "TEXT"', function() {
        var value = 'Test';
        var sqlType = {original: 'string', sql: 'TEXT'};
        expect(cache.resolveSQLType(value)).toEqual(sqlType);
    });
    it('Can resolve a number to the sqllite type "REAL"', function() {
        var value = 5;
        var sqlType = {original: 'number', sql: 'REAL'};
        expect(cache.resolveSQLType(value)).toEqual(sqlType);
    });
    it('Can resolve a boolean to the sqllite type "INTEGER"', function() {
        var value = true;
        var sqlType = {original: 'boolean', sql: 'INTEGER'};
        expect(cache.resolveSQLType(value)).toEqual(sqlType);
    });
    it('Can resolve a date to the sqllite type "INTEGER"', function() {
        var value = new Date(1349980826209);
        var sqlType = {original: 'date', sql: 'INTEGER'};
        expect(cache.resolveSQLType(value)).toEqual(sqlType);
    });
    it('Can resolve an array to the sqllite type TEXT', function() {
        var value = [true, "2", 3];
        var sqlType = {original: 'array', sql: 'TEXT'};
        expect(cache.resolveSQLType(value)).toEqual(sqlType);
    });

    /**
     * _OfflineCache.createColumnDefinition
     */
    it('Can create websql column definition for a single string', function() {
        var doc = { entry: {value: 'Test'}, entityName: 'test' };
        var key = '001';

        var definition = {
            key: '001',
            metaKey: 'test.001',
            createString: '"$key" TEXT PRIMARY KEY, "value" TEXT',
            updateString: '"value" = Test',
            columnNames: ['"$key"', '"value"'],
            columnTypes: ['string', 'string'],
            values: ['001', 'Test']
        };
        expect(cache._createSQLColumnDefinition(doc, key)).toEqual(definition);
    });
    it('Can create websql column definition for a single number', function() {
        var doc = { entry: {value: 5}, entityName: 'test' };
        var key = '001';

        var definition = {
            key: '001',
            metaKey: 'test.001',
            createString: '"$key" TEXT PRIMARY KEY, "value" REAL',
            updateString: '"value" = 5',
            columnNames: ['"$key"', '"value"'],
            columnTypes: ['string', 'number'],
            values: ['001', 5]
        };
        expect(cache._createSQLColumnDefinition(doc, key)).toEqual(definition);
    });
    it('Can create websql column definition for a single boolean', function() {
        var doc = { entry: {value: true}, entityName: 'test' };
        var key = '001';

        var definition = {
            key: '001',
            metaKey: 'test.001',
            createString: '"$key" TEXT PRIMARY KEY, "value" INTEGER',
            updateString: '"value" = 1',
            columnNames: ['"$key"', '"value"'],
            columnTypes: ['string', 'boolean'],
            values: ['001', 1]
        };
        expect(cache._createSQLColumnDefinition(doc, key)).toEqual(definition);
    });
    it('Can create websql column definition for a single date', function() {
        var doc = { entry: {value: new Date(1349980826209)}, entityName: 'test' };
        var key = '001';

        var definition = {
            key: '001',
            metaKey: 'test.001',
            createString: '"$key" TEXT PRIMARY KEY, "value" INTEGER',
            updateString: '"value" = 1349980826209',
            columnNames: ['"$key"', '"value"'],
            columnTypes: ['string', 'date'],
            values: ['001', 1349980826209]
        };
        expect(cache._createSQLColumnDefinition(doc, key)).toEqual(definition);
    });
    it('Can create websql column definition for a multiple mixed entry', function() {
        var doc = { entry: {
            value: 'Testing',
            count: 3,
            success: true,
            stamp: new Date(1349980826209)
        }, entityName: 'test' };
        var key = '001';

        var definition = {
            key: '001',
            metaKey: 'test.001',
            createString: '"$key" TEXT PRIMARY KEY, "value" TEXT, "count" REAL, "success" INTEGER, "stamp" INTEGER',
            updateString: '"value" = Testing, "count" = 3, "success" = 1, "stamp" = 1349980826209',
            columnNames: ['"$key"', '"value"', '"count"', '"success"', '"stamp"'],
            columnTypes: ['string', 'string', 'number', 'boolean', 'date'],
            values: ['001', 'Testing', 3, 1, 1349980826209]
        };
        expect(cache._createSQLColumnDefinition(doc, key)).toEqual(definition);
    });





});
});