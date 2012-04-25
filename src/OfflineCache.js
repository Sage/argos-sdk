define('Sage/Platform/Mobile/OfflineCache', [
    'dojo/_base/lang',
    'dojo/_base/json'
], function(
    lang,
    json
) {
    var _database,
        supported = (!!window.openDatabase && 'sql') || (!!window.indexedDB && 'indexeddb');

    return lang.setObject('Sage.Platform.Mobile.OfflineCache', {
        supported: supported,
        cacheDescriptionText: 'Sage Offline Cache',
        invalidDateText: 'Invalid Date',
        version: 1,

        init: function() {
            if (this.supported === 'sql')
            {
                _database = openDatabase('argos', this.version, this.cacheDescriptionText, 5242880);
                this.createInitialSQLDatabase();
            }
        },

        createInitialSQLDatabase: function() {
            _database.transaction(function(transaction) {
                transaction.executeSql('CREATE TABLE IF NOT EXISTS cache (id INTEGER PRIMARY KEY ASC, dateStamp DATETIME, url TEXT UNIQUE, entry TEXT)');
            });
        },
        clearSQLDatabase: function() {
            if (!_database) return;

            _database.transaction(function(transaction) {
                transaction.executeSql('DROP TABLE IF EXISTS cache');
            });
            this.createInitialSQLDatabase();
        },

        /**
         * Inserts the JSON entry into the database for the given URL
         * @param url String - The URL that uniquely identifies the entry, this will serve as a "key"
         * @param entry Object/JSON - The SData response entry/feed to be stored for offline caching.
         * @param options Object - Optional. The keys `success` and `failure` will used as a callback function within the scope of the `scope` key.
         */
        insertItem: function(url, entry, options) {
            var stamp = new Date().getTime(),
                scope = this;

            if (typeof entry !== 'string')
                entry = json.toJson(entry);

            if (this.supported === 'sql')
            {
                _database.transaction(function(transaction) {
                    transaction.executeSql('INSERT OR REPLACE INTO cache(dateStamp, url, entry) VALUES (?,?,?)',
                        [stamp, url, entry],
                        lang.hitch(scope, scope.onInsertSuccess, options.success, options.scope),
                        lang.hitch(scope, scope.onInsertError, options.failure, options.scope)
                    );
                });
            }
        },

        getItem: function(url, options) {
            var scope = this;

            if (this.supported === 'sql')
            {
                _database.readTransaction(function(transaction) {
                    transaction.executeSql('SELECT * FROM cache WHERE url=?',
                        [url],
                        lang.hitch(scope, scope.onGetSuccess, options.success, options.scope),
                        lang.hitch(scope, scope.onGetSuccess, options.success, options.scope)
                    );
                });
            }
        },

        deleteAsOfDate: function(date, options) {
            if (date instanceof Date)
                date = date.getTime();
            else if (isNaN(date))
                this.onDeleteError(options.failure, options.scope || this, null, {message: this.invalidDateText});

            var scope = this;

            if (this.supported === 'sql')
            {
                _database.transaction(function(transaction) {
                    transaction.executeSql('DELETE FROM cache WHERE dateStamp < ?',
                        [date],
                        lang.hitch(scope, scope.onDeleteSuccess, options.success, options.scope),
                        lang.hitch(scope, scope.onDeleteError, options.failure, options.scope)
                    );
                });
            }
        },

        deleteEntry: function(url, options) {
            var scope = this;

            if (this.supported === 'sql')
            {
                _database.transaction(function(transaction) {
                    transaction.executeSql('DELETE FROM cache WHERE url = ?',
                        [url],
                        lang.hitch(scope, scope.onDeleteSuccess, options.success, options.scope),
                        lang.hitch(scope, scope.onDeleteError, options.failure, options.scope)
                    );
                });
            }
        },

        clear: function() {
            this.clearSQLDatabase();
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