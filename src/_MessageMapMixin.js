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
 * _MessageMapMixin
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
    /**
     * Allows a widget to map messages to actions by defining an message map.
     */
    return declare('argos._MessageMapMixin', null, {
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