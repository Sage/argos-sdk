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

define('Sage/Platform/Mobile/ErrorManager', ['dojo', 'dojo/string'], function() {

    return dojo.setObject('Sage.Platform.Mobile.ErrorManager', {
        //Localization
        abortedText: 'Aborted',

        /**
         * Total amount of errors to keep
         */
        errorCacheSizeMax: 10,

        errors: null,

        /**
         * Adds a custom error item by combining error message/options for easier tech support
         * @param serverResponse Full response from server, status, responsetext, etc.
         * @param requestOptions GET or POST options sent, only records the URL at this time
         * @param viewOptions The View Options of the view in which the error occurred
         * @param failType String, either "failure" or "aborted" as each response has different properties
         */
        addError: function(serverResponse, requestOptions, viewOptions, failType) {
            var errorDate = new Date(),
                dateStamp = dojo.string.substitute('/Date(${0})/',[errorDate.getTime()]),
                errorItem = {
                    errorDate: errorDate.toString(),
                    errorDateStamp: dateStamp,
                    url: requestOptions.url,
                    viewOptions: this.serializeValues(viewOptions),
                    "$key": dateStamp
                };

            if (failType === 'failure')
                dojo.mixin(errorItem, this.extractFailureResponse(serverResponse));

            if (failType === 'aborted')
                dojo.mixin(errorItem, this.extractAbortResponse(serverResponse));

            this.checkCacheSize();
            this.errors.push(errorItem);
            this.onErrorAdd();
            this.save();
        },

        /**
         * Explicitly extract values due to how read-only objects are enforced
         * @param response XMLHttpRequest object sent back from server
         * @return Object with only relevant, standard properties
         */
        extractFailureResponse: function(response){
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
         * @param json String Json formatted string
         */
        fromJsonArray: function(json){
            var o;
            try
            {
                o = dojo.fromJson(json);
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
         * @param response XMLHttpRequest object sent back from server
         * @return Object with hardset abort info
         */
        extractAbortResponse: function(response){
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
         * JSON serializes an object by recursively discarding non value keys
         * @param obj Object to be JSON serialized
         */
        serializeValues: function(obj){
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
                            obj[key] = 'Scope is not saved in error report';
                            break;
                        }
                        obj[key]=this.serializeValues(obj[key]);
                        break;
                }
            }
            return obj;
        },

        /**
         * Ensures there is at least 1 open spot for a new error by checking against errorCacheSizeMax
         */
        checkCacheSize: function() {
            var errLength = this.errors.length,
                cacheSizeIndex = this.errorCacheSizeMax - 1;
            if (errLength > cacheSizeIndex)
                this.removeError(cacheSizeIndex, errLength - cacheSizeIndex);
        },

        /**
         * Retrieve a error item that has the specified key|value pair
         * @param key Property of error item to check, such as errorDate or url
         * @param value Value of the key to match against
         * @return errorItem Returns the first error item in the match set or null if none found
         */
        getError: function(key, value){
            var errorList = this.getAllErrors();
            for (var i=0; i<errorList.length; i++) {
                if (errorList[i][key] == value)
                    return errorList[i];
            }
            return null;
        },

        getAllErrors: function() {
            return this.errors;
        },

        removeError: function(index, amount) {
            this.errors.splice(index, amount || 1);
        },

        /**
         * Event that occurs when an error is successfully added (not guaranteed to be saved)
         * Can be used for event binding
         */
        onErrorAdd: function() {
        },

        init: function(){
            this.errors = [];
            this.load();
        },

        save: function(){
            try
            {
                if (window.localStorage)
                    window.localStorage.setItem('errorlog', dojo.toJson(this.errors));
            }
            catch(e) {}
        },

        load: function(){
            try
            {
                if (window.localStorage)
                    this.errors = dojo.fromJson(window.localStorage.getItem('errorlog')) || [];
            }
            catch(e) {}
        }
    });
});