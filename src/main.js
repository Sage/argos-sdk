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
 * Provides require aliases for the application, customizations and scene instances.
 * @alernateClassName main
 */
define('argos', ['dojo/_base/window'], function(win) {
    var global = win.global,
        /* todo: store instances in a more appropriate manner? */
        application = function() { return global.App; },
        customizations = function() { return global.App.customizations; },
        scene = function() { return global.App.scene; },
        map = {
            'application': application,
            'customizations': customizations,
            'scene': scene
        };
    return {
        load: function(id, require, callback) {
            callback(map[id]);
        }
    };
});