define('spec/_OfflineCache', [
    'dojo/_base/lang',
    'argos/_OfflineCache'
], function(
    lang,
    _OfflineCache
) {
return describe('argos._OfflineCache', function() {
    var cache;

    beforeEach(function() {
        cache = lang.clone(_OfflineCache);
    });

    it('Can call create SQL database on startup when SQL is the detected type', function() {
        cache._databaseType = 'sql';

        spyOn(cache, 'createSQLDatabase');

        cache.startup();
        expect(cache.createSQLDatabase).toHaveBeenCalled();
    });
    it('Can call create IDB database on startup when IDB is the detected type', function() {
        cache._databaseType = 'indexeddb';

        spyOn(cache, 'createIDBDatabase');

        cache.startup();
        expect(cache.createIDBDatabase).toHaveBeenCalled();
    });

    it('Can successfully create a sql database (requires WebSQL compat browser)', function() {
        spyOn(cache, 'onCreateSQLSuccess');

        cache.createSQLDatabase();

        expect(cache.onCreateSQLSuccess).toHaveBeenCalled();
        expect(cache._database).not.toBe(null);
    });




});
});