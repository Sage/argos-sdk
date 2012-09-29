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
define('argos/environment', [
    'dojo/_base/lang',
    'dojo/string'
], function(
    lang,
    string
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

        /**
         * Creates the database based on the detected type
         */
        startup: function() {
            switch(this._databaseType)
            {
                case 'sql': this.createSQLDatabase(); break;
                case 'indexeddb': this.createIDBDatabase(); break;
                default: return false;
            }
        },

        /**
         * Creates the WebSQL database
         */
        createSQLDatabase: function() {
            this._database = openDatabase('argos', this.version, this.descriptionText, 5242880, this.onCreateSQLSuccess.bindDelegate(this))
        },

        /**
         * Handler for when the SQL database is first created
         */
        onCreateSQLSuccess: function() {
            // todo: determine what sort of meta data might be needed
            this._database.transaction(function(transaction) {
                transaction.executeSql('CREATE TABLE IF NOT EXISTS meta (id INTEGER PRIMARY KEY ASC, dateStamp DATETIME)');
            });
        },

        /**
         * Creates the IndexedDB database
         */
        createIDBDatabase: function() {

        },


        /**
         * Empties the database of all data
         */
        clear: function() {

        }
    });
});