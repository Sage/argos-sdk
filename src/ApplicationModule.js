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
        _signals: null,
        application: null,
        constructor: function(options) {
            this._signals = [];

            lang.mixin(this, options);
        },
        destroy: function() {
            array.forEach(this._signals, function(signal) {
                signal.remove();
            });

            delete this._signals;

            this.uninitialize();
        },
        uninitialize: function() {

        },
        startup: function() {
            this.loadCustomizations(this.application); /* todo: potentially replace application with customization set */
            this.loadViews(this.application && this.application.scene);
        },
        setApplication: function(application) {
            this.application = application;
        },
        loadCustomizations: function(customizationSet) {
        },
        loadViews: function(scene) {
        },
        /**
         * @deprecated
         * @param view
         */
        registerView: function(view) {
            var scene = this.application && this.application.scene;
            if (scene)
                scene.registerView(view.id, view);
        },
        /**
         * @deprecated
         * @param set
         * @param id
         * @param spec
         */
        registerCustomization: function(set, id, spec) {
            var customizationSet = this.application;
            if (customizationSet)
                customizationSet.registerCustomization(set, id, spec);
        }
    });
});