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

        /**
         * Total amount of error reports to keep
         */
        errorCacheSizeMax: 10,

        /**
         * Array of custom error items
         */
        errors: null,

        /**
         * Called at application start
         */
        init: function(){
            this.errors = [];
            this.load();
        },

        /**
         * Adds a custom error item by combining error message/options for easier tech support
         * @param serverResponse Full response from server, status, responsetext, etc.
         * @param requestOptions GET or POST options sent, only records the URL at this time
         * @param viewOptions The View Options of the view in which the error occurred
         */
        addError: function(serverResponse, requestOptions, viewOptions){
            var errorDate = new Date(),
                dateStamp = dojo.string.substitute('/Date(${0})/',[errorDate.getTime()]),
                errorItem = {
                    errorDate: errorDate.toString(),
                    errorDateStamp: dateStamp,
                    serverResponse: serverResponse,
                    url: requestOptions.url,
                    viewOptions: viewOptions,
                    '$descriptor': serverResponse.statusText,
                    '$key': dateStamp /* todo: change to something more readable? */
                };

            // this removes the readonly restriction by converting to normal Object
            errorItem = dojo.fromJson(dojo.toJson(errorItem));

            // remove duplicate info as we convert it all to text anyways
            if(errorItem.serverResponse.response && errorItem.serverResponse.responseText)
                delete errorItem.serverResponse.response;

            // SData sends back json as the error text with further keys that can be used
            errorItem.serverResponse.responseText = dojo.fromJson(errorItem.serverResponse.responseText)[0];
            
            this.checkCacheSize();
            this.errors.push(errorItem);
            this.onErrorAdd();
            this.save();
        },

        /**
         * Ensures there is at least 1 open spot for a new error by checking against errorCacheSizeMax
         */
        checkCacheSize: function(){
            var errLength = this.errors.length,
                cacheSizeIndex = this.errorCacheSizeMax-1;
            if(errLength > cacheSizeIndex)
                this.removeError(cacheSizeIndex, errLength-cacheSizeIndex);
        },

        /**
         * Saves the entire errors array as JSON to the users localStorage
         * If local storage is not supported/disabled, then it does not save.
         */
        save: function(){
            try {
                if (window.localStorage)
                    window.localStorage.setItem('errorlog', dojo.toJson(this.errors));
            }
            catch(e) {alert(e)}
        },

        /**
         * Loads from localStorage any previous errors.
         */
        load: function(){
            try {
                if (window.localStorage)
                    this.errors = dojo.fromJson(window.localStorage.getItem('errorlog')) || [];
            }
            catch(e) {alert(e);}
        },

        /**
         * Retrieves a list of errors that match the specified key|value pair
         * @param key Property of error item to check, such as errorDate or url
         * @param value Value of the key to match against
         * @return errorItem Returns the first error item in the match set or null if none found
         */
        getError: function(key, value){
            var errorItem = dojo.filter(this.errors, function(item){
                return item[key] == value;
            });
            return errorItem[0] || null;
        },

        /**
         * Returns the entire error array
         */
        getAllErrors: function(){
            return this.errors;
        },

        /**
         * Removes an error at the given index
         * @param index Index of error to remove
         * @param amount Optional. Number of items to remove, defaults to 1.
         */
        removeError: function(index, amount){
            amount = amount || 1;

            if(index+amount > this.errors.length)
                amount = this.errors.length - index;

            this.errors.splice(index, amount);
        },

        /**
         * Event that occurs when an error is successfully added (not guaranteed to be saved)
         * Can be used for event binding/function chaining
         */
        onErrorAdd: function(){
        }
    });
});