/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Offline caching - storage and retrieval.
 * @alternateClassName _OfflineCache
 * @singleton
 */
define('argos/_OfflineCache', [
    'dojo/_base/lang',
    './utility'
], function(
    lang,
    utility
) {
    window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var dbType = (!!window.openDatabase && 'sql') || (!!window.indexedDB && 'indexeddb');

    return lang.setObject('argos._OfflineCache', {
        /**
         * @property {String/Boolean}
         * If WebSQL or IndexedDB is available it will be 'sql' and 'indexeddb' respectively. False if
         * neither database is implemented.
         */
        _databaseType: dbType,

        /**
         * @property {String}
         * Description of the database, this is visible to users within their browser settings.
         */
        descriptionText: 'Sage Offline Cache',

        /**
         * @cfg {String}
         * Database version. Versioning is not well supported but it is here for when it is.
         */
        version: '1.0',

        /**
         * @property {Object}
         * The database instance
         */
        _database: null,

        _tables: {},

        /**
         * Creates the database based on the detected type
         */
        startup: function() {
            switch(this._databaseType)
            {
                case 'sql': this._createSQLDatabase(); break;
                case 'indexeddb': this._createIDBDatabase(); break;
                default: return false;
            }

            // todo: load table names into _tables
        },

        /**
         * Opens the intitial SQL database and sets up the initial schema
         */
        _createSQLDatabase: function() {
            this._database = openDatabase('argos', this.version, this.descriptionText, 5242880);

            // todo: determine what sort of meta data might be needed
            this._database.transaction(function(transaction) {
                transaction.executeSql('CREATE TABLE IF NOT EXISTS meta (id INTEGER PRIMARY KEY ASC, dateStamp DATETIME)');
            });
            this._tables['meta'] =  true;
        },

        /**
         * Creates the IndexedDB database
         */
        _createIDBDatabase: function() {
        },

        /**
         * Stores the given entry under the designated resourceKind store
         * @param {String} resourceKind
         * @param {Object} entry
         * @param {Function?} callback Optional.
         * @param {Object?} scope Optional.
         */
        setItem: function(resourceKind, entry, callback, scope) {
            switch(this._databaseType)
            {
                case 'sql': this._setSQLItem(resourceKind, entry, callback, scope); break;
                case 'indexeddb': this._setIDBItem(resourceKind, entry, callback, scope); break;
                default: return false;
            }
        },
        _setSQLItem: function(resourceKind, entry, callback, scope) {
            // split entry into [{resourceKind}, {resourceKind_relatedKind}, {_otherKind}]
            var document = this.splitResources(resourceKind, entry);
            this.processRelated(document);

            // loop entries, check if that resourceKind table exists
            // if not, create it
            // todo: decide if setItem for both entry/feed or setItem and setItems needed
            // update if entry exist, create if not
            // continue for each resourcekind

            // on final success (use dojo.Deferred), do callback with the scope
        },
        _setIDBItem: function(resourceKind, entry, callback, scope) {

        },

        /**
         * Takes a javascript object and splits the inner objects into an array recursively.
         *
         * The structure returned is:
         *
         *     {
         *         entityName: 'Kind',
         *         entry: {Only the properties at that level},
         *         resources: [{result of inner objects, also splitted using this function}, {}, {}]
         *     }
         *
         *
         * @param {String} entityName The name of the entity (eg, Contact, Activity, etc) being stored
         * @param {Object} entry Item to be split
         * @return {Object}
         */
        splitResources: function(entityName, entry) {
            var doc = {
                entityName: entityName,
                entry: entry,
                related: []
            };

            for (var prop in entry)
            {
                switch(typeof entry[prop])
                {
                    case 'function':
                        delete entry[prop]; // should never be receiving functions
                        break;
                    case 'object':
                        var relatedEntityName = entityName + '_' + prop;
                        doc.related.push(this.splitResources(relatedEntityName, entry[prop]));
                        delete entry[prop];
                        break;
                }
            }

            return doc;
        },
        /**
         *
         * @param {Object} doc
         */
        processRelated: function(doc) {
            for (var i = 0; i < doc.related.length; i++)
            {
                var related = doc.related[i],
                    tableName = related['entityName'],
                    key = utility.uuid();

                if (!this.tableExists(tableName))
                {
                    // todo: get column types
                    // todo: create table
                }

                doc['entry'][tableName] = key;




            }
        },
        /**
         *
         * @param {String} tableName
         * @return {Boolean}
         */
        tableExists: function(tableName) {
            return !!this._tables[tableName];
        },



        /**
         * Empties the database of all data
         */
        clear: function() {
            switch(this._databaseType)
            {
                case 'sql': this._clearSQLDatabase(); break;
                case 'indexeddb': this._clearIDBDatabase(); break;
                default: return false;
            }
        },
        _clearSQLDatabase: function() {
            var db = this._database;
            db.transaction(function(transaction) {
                transaction.executeSql("SELECT tbl_name FROM sqlite_master WHERE type='table';", [], function(tx, results) {
                    var names = [];

                    for (var i = 0; i < results.rows.length; i++)
                    {
                        var item = results.rows.item(i);
                        if (item['tbl_name'] !== '__WebKitDatabaseInfoTable__')
                            names.push(item['tbl_name']);
                    }

                    db.transaction(function(deleteTransaction) {
                        deleteTransaction.executeSql('DROP TABLE ' + names.join('; '));
                    });
                });
            });
        },
        _clearIDBDatabase: function() {

        },

        /**
         * Empties the database of a particular "set": SQL = table, IDB = document
         * @param {String} setName
         */
        clearSet: function(setName) {
            switch(this._databaseType)
            {
                case 'sql': this._clearSQLTable(setName); break;
                case 'indexeddb': this._clearIDBDocument(setName); break;
                default: return false;
            }
        },
        _clearSQLTable: function(tableName) {
            this._database.transaction(function(transaction) {
                transaction.executeSql('DROP TABLE ' + tableName);
            });
        },
        _clearIDBDocument: function(docName) {

        },


        /**
         * Deletes the specified key
         * @param key
         */
        clearItem: function(key) {

        }
    });
});