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
 * ErrorManager is a singleton that parses and stores SData error responses into localStorage.
 * @alternateClassName ErrorManager
 * @singleton
 */
define('Sage/Platform/Mobile/ErrorManager', [
    'dojo/_base/json',
    'dojo/_base/lang',
    'dojo/_base/connect',
    'dojo/string'
], function(
    json,
    lang,
    connect,
    string
) {
    var errors = [];
    try
    {
        if (window.localStorage)
            errors = json.fromJson(window.localStorage.getItem('errorlog')) || [];
    }
    catch(e)
    {

    }

    return lang.setObject('Sage.Platform.Mobile.ErrorManager', {
        //Localization

        /**
         * Text used in place of statusText for aborted errors.
         */
        abortedText: 'Aborted',
        /**
         * Text put in place of the scope property to prevent circular references.
         */
        scopeSaveText: 'Scope is not saved in error report',

        /**
         * @property {Number}
         * Total amount of errors to keep
         */
        errorCacheSizeMax: 10,

        /**
         * Adds a custom error item by combining error message/options for easier tech support
         * @param {Object} serverResponse Full response from server, status, responsetext, etc.
         * @param {Object} requestOptions GET or POST options sent, only records the URL at this time
         * @param {Object} viewOptions The View Options of the view in which the error occurred
         * @param {String} failType Either "failure" or "aborted" as each response has different properties
         */
        addError: function(serverResponse, requestOptions, viewOptions, failType) {
            var errorDate = new Date(),
                dateStamp = string.substitute('/Date(${0})/',[errorDate.getTime()]),
                errorItem = {
                    errorDate: errorDate.toString(),
                    errorDateStamp: dateStamp,
                    url: requestOptions.url,
                    viewOptions: this.serializeValues(viewOptions),
                    "$key": dateStamp
                };

            if (failType === 'failure')
                lang.mixin(errorItem, this.extractFailureResponse(serverResponse));

            if (failType === 'aborted')
                lang.mixin(errorItem, this.extractAbortResponse(serverResponse));

            this.checkCacheSize();
            errors.push(errorItem);
            this.onErrorAdd();
            this.save();
        },

        /**
         * Explicitly extract values due to how read-only objects are enforced
         * @param {Object} response XMLHttpRequest object sent back from server
         * @return {Object} Object with only relevant, standard properties
         */
        extractFailureResponse: function(response) {
            var failureResponse = {
                "$descriptor": response.statusText,
                "serverResponse": {
                    "readyState": response.readyState,
                    "responseXML": response.responseXML,
                    "status": response.status,
                    "responseType": response.responseType,
                    "withCredentials": response.withCredentials,
                    "responseText": response.responseText
                        ? this.fromJsonArray(response.responseText)
                        : "",
                    "statusText": response.statusText
                }
            };
            return failureResponse;
        },

        /**
         * Attempts to parse a json string into a javascript object
         * The need for this function is the fallback in case of failure
         * @param {String} json Json formatted string or array.
         * @return {Object} Javascript object from json string.
         */
        fromJsonArray: function(json) {
            var o;
            try
            {
                o = json.fromJson(json);
                o = o[0];
            }
            catch(e)
            {
                o = {
                    message: json,
                    severity: ""
                };
            }
            return o;
        },

        /**
         * Abort error is hardset due to exceptions from reading properties
         * FF 3.6: https://bugzilla.mozilla.org/show_bug.cgi?id=238559
         * @param {Object} response XMLHttpRequest object sent back from server
         * @return {Object} Object with hardset abort info
         */
        extractAbortResponse: function(response) {
            var abortResponse = {
                "$descriptor": this.abortedText,
                "serverResponse": {
                    "readyState": 4,
                    "responseXML": "",
                    "status": 0,
                    "responseType": "",
                    "withCredentials": response.withCredentials,
                    "responseText": "",
                    "statusText": this.abortedText
                }
            };
            return abortResponse;
        },

        /**
         * Prepares an object for JSON serialization by recursively discarding non value keys
         * @param {Object} obj Object to be JSON serialized
         * @return {Object} Cleaned object for for JSON serialization
         */
        serializeValues: function(obj) {
            for (var key in obj){
                switch(typeof obj[key]){
                    case 'undefined':
                        obj[key] = 'undefined';
                        break;
                    case 'function':
                        delete obj[key];
                        break;
                    case 'object':
                        if (obj[key] === null) {
                            obj[key] = 'null';
                            break;
                        }
                        if(key === 'scope') { // eliminate recursive self call
                            obj[key] = this.scopeSaveText;
                            break;
                        }
                        obj[key] = this.serializeValues(obj[key]);
                        break;
                }
            }
            return obj;
        },

        /**
         * Ensures there is at least 1 open spot for a new error by checking against errorCacheSizeMax
         * and removing old errors as needed
         */
        checkCacheSize: function() {
            var errLength = errors.length,
                cacheSizeIndex = this.errorCacheSizeMax - 1;

            if (errLength > cacheSizeIndex)
                this.removeError(cacheSizeIndex, errLength - cacheSizeIndex);
        },

        /**
         * Retrieve a error item that has the specified key|value pair
         * @param {String} key Property of error item to check, such as errorDate or url
         * @param {Number/String} value Value of the key to match against
         * @return {Object} Returns the first error item in the match set or null if none found
         */
        getError: function(key, value) {
            var errorList = this.getAllErrors();

            for (var i = 0; i < errorList.length; i++)
            {
                if (errorList[i][key] == value)
                    return errorList[i];
            }

            return null;
        },

        /**
         * Returns a copy of all errors.
         * @return {Object[]} Array of error objects.
         */
        getAllErrors: function() {
            return lang.clone(errors);
        },

        /**
         * Removes the specified index from the error list.
         * @param {Number} index Index of error to remove.
         * @param {Number} amount Number of errors to remove from indexed point, if not provided defaults to 1.
         */
        removeError: function(index, amount) {
            errors.splice(index, amount || 1);
        },

        /**
         * Publishes the `/app/refresh` event to notify that an error has been added
         */
        onErrorAdd: function() {
            connect.publish('/app/refresh', [{
                resourceKind: 'errorlogs'
            }]);
        },

        /**
         * Attempts to save all errors into localStorage under the `errorlog` key.
         */
        save: function() {
            try
            {
                if (window.localStorage)
                    window.localStorage.setItem('errorlog', json.toJson(errors));
            }
            catch(e)
            {

            }
        }
    }
);
});