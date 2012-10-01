define('spec/_OfflineCache.spec', [
    'dojo/_base/lang',
    'argos/_OfflineCache'
], function(
    lang,
    _OfflineCache
) {
return describe('argos._OfflineCache', function() {
    var cache = _OfflineCache;

    it('Can call create SQL database on startup when SQL is the detected type', function() {
        cache._databaseType = 'sql';

        spyOn(cache, 'createSQLDatabase');

        cache.startup();
        expect(cache.createSQLDatabase).toHaveBeenCalled();
    });
    it('Can successfully create a sql database (requires WebSQL compat browser)', function() {

        cache.startup();
        waitsFor(function() {
            return cache._database !== null;
        }, "Creating SQL database", 5000);

        expect(cache._database).not.toBe(null);
    });




});
});