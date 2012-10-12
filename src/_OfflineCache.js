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
    'dojo/string',
    './utility'
], function(
    lang,
    string,
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
         * @cfg {String}
         * Unique identifier that should be present in every item being stored and on each related item
         * if an entry has related objects attached.
         */
        keyProperty: '$key',

        /**
         * @property {Object}
         * The database instance
         */
        _database: null,

        _tables: {},
        _keys: {},

        typeResolves: {
            'string': 'TEXT',
            'number': 'REAL',
            'date': 'INTEGER',
            'boolean': 'INTEGER'
        },

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
                case 'sql': this._setSQLEntry(resourceKind, entry, callback, scope); break;
                case 'indexeddb': this._setIDBEntry(resourceKind, entry, callback, scope); break;
                default: return false;
            }
        },
        _setSQLEntry: function(resourceKind, entry, callback, scope) {
            // split entry into [{resourceKind}, {resourceKind_relatedKind}, {_otherKind}]
            var doc = this._splitSQLResources(resourceKind, entry);
            doc = this._processSQLRelated(doc);

            var key = doc.entry[this.keyProperty] || utility.uuid();

            //todo: pass callback/scope to final execution
            this._processSQLEntry(doc, key);
        },
        _setIDBEntry: function(resourceKind, entry, callback, scope) {

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
        _splitSQLResources: function(entityName, entry) {
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
                        if (entry[prop] instanceof Date)
                            break;

                        var relatedEntityName = entityName + '.' + prop;
                        doc.related.push(this._splitSQLResources(relatedEntityName, entry[prop]));
                        delete entry[prop];
                        break;
                }
            }

            return doc;
        },

        /**
         * Creates, inserts or updates the related entities while updating the parent document with
         * the foreign key.
         * @param {Object} doc
         */
        _processSQLRelated: function(doc) {
            for (var i = 0; i < doc.related.length; i++)
            {
                var related = this._processSQLRelated(doc.related[i]),
                    key = related.entry[this.keyProperty] || utility.uuid();

                this._processSQLEntry(related, key);

                doc['entry'][related.entityName] = key;
            }

            return doc;
        },
        /**
         * Takes a doc entry and creates the table if needed then inserts or updates the item
         * @param {Object} doc
         */
        _processSQLEntry: function(doc, key) {
            var tableName = doc.entityName,
                definition = this._createSQLColumnDefinition(doc.entry, key);

            if (!this.tableExists(tableName))
            {
                this._createSQLTable(tableName, definition.createString);
                // todo: add tableName to meta tableNames table
            }

            this._setSQLItem(tableName, definition);
        },

        /**
         * Executes a CREATE TABLE sql call with the given column definition string
         * @param {String} name
         * @param {String} columns
         */
        _createSQLTable: function(name, columns) {
            var createTableQuery = string.substitute('CREATE TABLE IF NOT EXISTS [${0}](${1})', [
                name,
                columns
            ]);
            this.executeSQLTransaction(createTableQuery, [], null, null);
        },

        /**
         * Determines if the item being stored should be an INSERT or UPDATE and calls the correct handler
         * @param tableName
         * @param columnDefinition
         */
        _setSQLItem: function(tableName, columnDefinition) {
            if (this._keys[columnDefinition.key])
                this._updateSQLItem(tableName, columnDefinition);
            else
                this._insertSQLItem(tableName, columnDefinition);
        },
        /**
         * Executes an INSERT sql statement with the give table and column definition object that contains
         * the col headers and values
         * @param {String} tableName
         * @param {Object} columnDefinition
         */
        _insertSQLItem: function(tableName, columnDefinition) {
            var insertQuery = string.substitute('INSERT INTO [${0}](${1}) VALUES (${2})', [
                tableName,
                columnDefinition.columnNames,
                Array(columnDefinition.columnNames.length + 1).join('?,').slice(0, -1)
            ]);
            this.executeSQLTransaction(insertQuery, columnDefinition.values, null, null);

            // todo: add item key to meta keys table
        },

        /**
         * Executes an UPDATE sql statement with the give table and column definition object that contains
         * the col headers and values
         * @param {String} tableName
         * @param {Object} columnDefinition
         */
        _updateSQLItem: function(tableName, columnDefinition) {
            var updateQuery = string.substitute('UPDATE [${0}] SET ${1} WHERE "${2}"="${3}"', [
                tableName,
                columnDefinition.updateString,
                this.keyProperty,
                columnDefinition.key
            ]);
            this.executeSQLTransaction(updateQuery, [], null, null);
        },

        /**
         * Executes the given SQL query with the passes params. The appropriate callback will be
         * called on return.
         * @param query
         * @param args
         * @param success
         * @param failure
         */
        executeSQLTransaction: function(query, args, success, failure) {
            this._database.transaction(function(transaction) {
                transaction.executeSql(query, args, success, failure);
            });
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
         * Creates a column string that can be used when creating a WebSQL table
         * @param {Object} entry
         * @param {String} key
         * @return {Object}
         */
        _createSQLColumnDefinition: function(entry, key) {
            var identifier = this.keyProperty || '__ID',
                definition = {
                    key: key,
                    createString: ['"'+identifier+'" TEXT PRIMARY KEY'],
                    updateString: [],
                    columnNames: ['"'+identifier+'"'],
                    values: [key]
                };

            for (var prop in entry)
            {
                if (prop == this.keyProperty)
                    continue;

                var value = this.formatSQLValueByType(entry[prop]),
                    type = this.resolveSQLType(entry[prop]),
                    escapedProp = '"' + prop + '"';

                definition.createString.push(escapedProp + ' ' + type);
                definition.updateString.push(escapedProp + ' = ' + value);
                definition.columnNames.push(escapedProp);
                definition.values.push(value);
            }
            definition.createString = definition.createString.join(', ');
            definition.updateString = definition.updateString.join(', ');

            return definition;
        },
        /**
         * Resolves a javascript type into the correct sqllite type
         * @param value
         * @return {String}
         */
        resolveSQLType: function(value) {
            var type = typeof value;

            if (type == 'object' && value instanceof Date)
                type = 'date';

            type = this.typeResolves[type];

            return type;
        },
        /**
         * Converts the given value into the appropriate sqllite value.
         *
         * * Date objects get converted to milliseconds from 1970
         * * Boolean values get converted to 1/0 for true/false
         *
         * @param value
         */
        formatSQLValueByType: function(value) {
            var formatted;

            switch(typeof value)
            {
                case "object":
                    if (value instanceof Date)
                        formatted = value.getTime();
                    break;
                case "boolean":
                    formatted = (value) ? 1 : 0;
                    break;
                default:
                    formatted = value;
            }

            return formatted;
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
            var clearQuery = string.substitute('DROP TABLE [${0}]', [tableName]);

            this.executeSQLTransaction(clearQuery, [], null, null);
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