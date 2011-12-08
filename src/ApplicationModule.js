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

define('Sage/Platform/Mobile/ApplicationModule', ['Sage/Platform/Mobile/Application'], function() {

    return dojo.declare('Sage.Platform.Mobile.ApplicationModule', null, {
        _connects: null,
        _subscribes: null,
        application: null,
        constructor: function(options) {
            this._connects = [];
            this._subscribes = [];

            dojo.mixin(this, options);
        },
        destroy: function() {
            dojo.forEach(this._connects, function(handle) {
                dojo.disconnect(handle);
            });

            dojo.forEach(this._subscribes, function(handle){
                dojo.unsubscribe(handle);
            });

            this.uninitialize();
        },
        uninitialize: function() {

        },
        init: function(application) {
            this.application = application;

            this.loadErrorManager();
            this.loadCustomizations();
            this.loadToolbars();
            this.loadViews();
        },
        loadErrorManager: function() {
            Sage.Platform.Mobile.ErrorManager.init();
        },
        loadCustomizations: function() {
        },
        loadViews: function() {
        },
        loadToolbars: function() {
        },
        registerView: function(view) {
            if (this.application)
                this.application.registerView(view);
        },
        registerToolbar: function(name, toolbar) {
            if (this.application)
                this.application.registerToolbar(name, toolbar);
        },
        registerCustomization: function(set, id, spec) {
            if (this.application)
                this.application.registerCustomization(set, id, spec);
        }
    });
});