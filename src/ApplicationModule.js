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

define('Sage/Platform/Mobile/ApplicationModule', [
    'dojo/_base/array',
    'dojo/_base/connect',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'Sage/Platform/Mobile/Application'
], function(
    array,
    connect,
    declare,
    lang
) {

    return declare('Sage.Platform.Mobile.ApplicationModule', null, {
        _connects: null,
        _subscribes: null,
        application: null,
        constructor: function(options) {
            this._connects = [];
            this._subscribes = [];

            lang.mixin(this, options);
        },
        destroy: function() {
            array.forEach(this._connects, function(handle) {
                connect.disconnect(handle);
            });

            array.forEach(this._subscribes, function(handle){
                connect.unsubscribe(handle);
            });

            this.uninitialize();
        },
        uninitialize: function() {

        },
        startup: function(application) {
            this.application = application;

            this.loadCustomizations();
            this.loadViews();
        },
        loadCustomizations: function() {
        },
        loadViews: function() {
        },
        registerView: function(view) {
            if (this.application)
                this.application.registerView(view);
        },
        registerCustomization: function(set, id, spec) {
            if (this.application)
                this.application.registerCustomization(set, id, spec);
        }
    });
});