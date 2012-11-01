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
 * _MessageMapMixin allows a widget to map messages to actions by defining an message map.
 *
 * Without going into too much detail MessageMapMixin adds the ability to create tunnels
 * between instances of views/fields/components.
 *
 * For example I have a field (with an id of `'Field1'`) that sets up a message map as:
 *
 *     messages: { 'onMessage': 'this._onGetMessage' }
 *
 * Now, anywhere else in code I can call that method by requiring `argos/Message` as `message` and:
 *
 *     message.send('Field1', 'onMessage', [args]);
 *
 * The function `_onGetMessage` of the field is now called with the parameter args provided.
 *
 *
 * This should be used with caution as it creates a coupling that is not normally desired (in regards
 * to testing and keeping a clear dependency graph).
 *
 * @alternateClassName _MessageMapMixin
 * @requires Message
 */
define('argos/_MessageMapMixin', [
    'dojo/_base/declare',
    './Message'
], function(
    declare,
    message
) {
    return declare('argos._MessageMapMixin', null, {
        /**
         * @cfg {Object}
         * Message map in the format of:
         *
         *     {'messageName': 'functionName'}
         *
         * `messageName` will be used to by the sender (along with the current object/class's `id`) to
         * call the `functionName` on the current object/class.
         *
         * Example:
         *
         * I have a view with an id of `'map_fullscreen'` it's messages map looks like:
         *
         *     messages: {
         *         'placePin': 'placePinAtCoord',
         *         'moveTo': 'moveToLocationByCoord'
         *     }
         *
         * Then elsewhere in code it would be possible to (requiring `argos/Message`):
         *
         *     message.send('map_fullscreen', 'moveTo', [33.566028, -111.913669]);
         *     message.send('map_fullscreen', 'placePin', [33.566028, -111.913669, 'Scottsdale Office']);
         *
         */
        messages: null,

        startup: function() {
            this.inherited(arguments);

            message.claim(this.id, this);
        },
        uninitialize: function() {
            this.inherited(arguments);

            message.revoke(this.id);
        },
        receive: function(message, args) {
            var method = this.messages[message];
            if (method && this[method])
            {
                this[method].apply(this, args);
            }
        }
    });
});