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
 * You may think of ApplicationModule as "loader" or initializer.
 *
 * @alternateClassName ApplicationModule
 * @requires App
 */
define('argos/ApplicationModule', [
    'dojo/_base/array',
    'dojo/_base/connect',
    'dojo/_base/declare',
    'dojo/_base/lang',
    './Application'
], function(
    array,
    connect,
    declare,
    lang
) {

    return declare('argos.ApplicationModule', null, {
        _signals: null,
        /**
         * @property {Object}
         * The {@link App App} instance for the application
         */
        application: null,
        /**
         * Mixes in the passed options object into itself
         * @param {Object} options Properties to be mixed in
         */
        constructor: function(options) {
            this._signals = [];

            lang.mixin(this, options);
        },
        /**
         * Destroy loops and removes all `_signals`s.
         * Also calls {@link #uninitialize uninitialize}
         */
        destroy: function() {
            array.forEach(this._signals, function(signal) {
                signal.remove();
            });

            delete this._signals;

            this.uninitialize();
        },
        /**
         * Performs any additional destruction requirements
         * @template
         */
        uninitialize: function() {

        },
        /**
         * 1. {@link #loadCustomizations loadCustomizations}
         * 1. {@link #loadViews loadViews}
         */
        startup: function() {
            this.loadCustomizations(this.application); /* todo: potentially replace application with customization set */
            this.loadViews(this.application && this.application.scene);
        },
        setApplication: function(application) {
            this.application = application;
        },
        /**
         * This function should be overriden in the app and be used to register all customizations.
         * @template
         */
        loadCustomizations: function(customizationSet) {
        },
        /**
         * This function should be overriden in the app and be used to register all views.
         * @template
         */
        loadViews: function(scene) {
        },
        /**
         * Legacy support for registering views. Now should be done through {@link scene scene}.
         * @deprecated
         * @param view
         */
        registerView: function(view) {
            var scene = this.application && this.application.scene;
            if (scene)
                scene.registerView(view.id, view);
        },
        /**
         * Legacy support for registering customizations. Now should be done through {@link scene scene}.
         * @deprecated
         * @param targetSet
         * @param id
         * @param spec
         */
        registerCustomization: function(targetSet, id, spec) {
            var customizationSet = this.application;
            if (customizationSet)
                customizationSet.registerCustomization(targetSet, id, spec);
        }
    });
});