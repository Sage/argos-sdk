define('Sage/Platform/Mobile/OfflineCache', [
    'dojo/_base/lang',
    'dojo/_base/json'
], function(
    lang,
    json
) {
   window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

    var _database,
        supported = (!!window.openDatabase && 'sql') || (!!window.indexedDB && 'indexeddb');

    return lang.setObject('Sage.Platform.Mobile.OfflineCache', {
        supported: supported,
        cacheDescriptionText: 'Sage Offline Cache',
        invalidDateText: 'Invalid Date',
        version: 1,

        init: function() {
            if (supported === 'sql')
            {
                _database = openDatabase('argos', this.version, this.cacheDescriptionText, 5242880);
                this.createInitialSQLDatabase();
            }
            else
            {
                var openRequest = window.indexedDB.open('argos', this.version);
                openRequest.onsuccess = lang.hitch(this, this.onCreateIDBDatabaseSuccess);
                openRequest.onupgradeneeded = lang.hitch(this, this.createInitialIDBDatabase);
                openRequest.onerror = lang.hitch(this, this.onCreateError);
            }

        },

        createInitialSQLDatabase: function() {
            _database.transaction(function(transaction) {
                transaction.executeSql('CREATE TABLE IF NOT EXISTS cache (id INTEGER PRIMARY KEY ASC, dateStamp DATETIME, url TEXT UNIQUE, entry TEXT)');
            });
        },

        createInitialIDBDatabase: function(e) {
            if (_database) return; // catch for browsers that run onupgradeneeded AND success
            _database = e.target.result;

            var objectStore = _database.createObjectStore('cache', {keyPath: 'url'});
            objectStore.createIndex('dateStamp', 'dateStamp', {unique: false});
            objectStore.createIndex('entry', 'entry', {unique: false});
        },

        onCreateIDBDatabaseSuccess: function(e) {
            if (_database) return; // catch for browsers that run onupgradeneeded AND success
            _database = e.target.result;
        },

        onCreateError: function(e) {
            if (console)
                console.warn('Unable to create cache indexeddb database', e);
        },

        /**
         * Inserts the JSON entry into the database for the given URL
         * @param url String - The URL that uniquely identifies the entry, this will serve as a "key"
         * @param entry JSON Object - The SData response entry/feed to be stored for offline caching.
         * @param options Object - Optional. The keys `success` and `failure` will used as a callback function within the scope of the `scope` key.
         */
        insertItem: function(url, entry, options) {
            if (arguments.length < 2) return;

            var stamp = new Date().getTime(),
                scope = this;

            if (typeof entry !== 'string')
                entry = json.toJson(entry);

            if (this.supported === 'sql')
                _database.transaction(function(transaction) {
                    transaction.executeSql('INSERT OR REPLACE INTO cache(dateStamp, url, entry) VALUES (?,?,?)',
                        [stamp, url, entry],
                        lang.hitch(scope, scope.onInsertSuccess, options.success, options.scope),
                        lang.hitch(scope, scope.onInsertError, options.failure, options.scope)
                    );
                });
            else
            {
                var transaction = _database.transaction(['cache'], IDBTransaction.READ_WRITE);
                transaction.oncomplete = lang.hitch(scope, scope.onInsertSuccess, options.success, options.scope);
                transaction.onerror = lang.hitch(scope, scope.onInsertError, options.failure, options.scope);

                var objectStore = transaction.objectStore('cache');
                objectStore.put({dateStamp: stamp, url: url, entry: entry});
            }
        },

        getItem: function(url, options) {
            var scope = this;

            if (this.supported === 'sql')
                _database.readTransaction(function(transaction) {
                    transaction.executeSql('SELECT * FROM cache WHERE url=?',
                        [url],
                        lang.hitch(scope, scope.onGetSuccess, options.success, options.scope),
                        lang.hitch(scope, scope.onGetSuccess, options.success, options.scope)
                    );
                });
            else
            {
                var transaction = _database.transaction(['cache'], IDBTransaction.READ_ONLY);
                var objectStore = transaction.objectStore('cache');
                var request = objectStore.get(url);
                request.onsuccess = lang.hitch(scope, scope.onGetSuccess, options.success, options.scope, request);
                request.onerror = lang.hitch(scope, scope.onGetSuccess, options.success, options.scope);
            }
        },

        deleteAsOfDate: function(date, options) {
            if (date instanceof Date)
                date = date.getTime();
            else if (isNaN(date))
                this.onDeleteError(options.failure, options.scope || this, null, {message: this.invalidDateText});

            var scope = this;

            if (this.supported === 'sql')
                _database.transaction(function(transaction) {
                    transaction.executeSql('DELETE FROM cache WHERE dateStamp < ?',
                        [date],
                        lang.hitch(scope, scope.onDeleteSuccess, options.success, options.scope),
                        lang.hitch(scope, scope.onDeleteError, options.failure, options.scope)
                    );
                });
            else
            {
                var deleteIndex = _database.transaction(['cache']).objectStore('cache').index('dateStamp');
                var upperBoundKeyRange = IDBKeyRange.upperBound(date, false);
                deleteIndex.openKeyCursor(upperBoundKeyRange).onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (cursor)
                    {
                        console.log(cursor);
//                        var deleteRequest = _database.transaction(['cache'], IDBTransaction.READ_WRITE).objectStore('cache').delete(cursor.key);
                        deleteRequest.onsuccess = lang.hitch(scope, scope.onDeleteSuccess, options.success, options.scope);
                        deleteRequest.onerror = lang.hitch(scope, scope.onDeleteError, options.failure, options.scope);
                    }
                };

            }
        },

        onInsertSuccess: function(callback, scope, transaction, e) {
            if (callback)
                callback.call(scope || this, e);
        },
        onInsertError: function(callback, scope, transaction, e) {
            if (callback)
                callback.call(scope || this, e);
        },

        onGetSuccess: function(callback, scope, transaction, results) {
            var item = null;

            if (this.supported === 'sql')
            {
                if (results.rows.length > 0)
                    item = results.rows.item(0);
            }
            else
            {
                if (transaction.result)
                    item = transaction.result;
            }
            console.log('get success', item);

            if (callback)
                callback.call(scope || this, item);
        },
        onGetError: function(callback, scope, transaction, e) {
            if (callback)
                callback.call(scope || this, e);
        },

        onDeleteSuccess: function(callback, scope, transaction, e) {
            if (callback)
                callback.call(scope || this, e);
        },
        onDeleteError: function(callback, scope, transaction, e) {
            if (callback)
                callback.call(scope || this, e);
        }
    });
});