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
 * Message service
 * @alternateClassName Message
 */
define('argos/Message', [
    'dojo/_base/lang',
    'dojo/_base/array'
], function(
    lang,
    array
) {
    /* async point to point messaging */
    /* for everything else, use pub-sub */
    return lang.setObject('argos.Message', {
        queues: null,
        channels: null,
        send: function(channel, message) {
            var channels = this.channels || (this.channels = {}),
                queues = this.queues || (this.queues = {});

            var target = channels[channel];
            if (target && target.receive)
            {
                target.receive(message, Array.prototype.slice.call(arguments, 2));
            }
            else
            {
                var queue = queues[channel] || (queues[channel] || []);

                queue.push([message, Array.prototype.slice.call(arguments, 2)]);
            }
        },
        sendOrIgnore: function(channel, message, arg0) {
            var channels = this.channels || (this.channels = {});

            var target = channels[channel];
            if (target && target.receive)
            {
                target.receive(message, Array.prototype.slice.call(arguments, 2));
            }
        },
        discard: function(channel) {
            var queues = this.queues || (this.queues = {});

            delete queues[channel];
        },
        claim: function(channel, target) {
            var channels = this.channels || (this.channels = {}),
                queues = this.queues || (this.queues = {});

            channels[channel] = target;

            var queue = queues[channel];
            if (queue && target.receive)
            {
                array.forEach(queue, function(message) {
                    target.receive(message[0], message[1]);
                });
            }
        },
        revoke: function(channel) {
            var slots = this.channels || (this.channels = {}),
                queues = this.queues || (this.queues = {});

            delete slots[channel];
            delete queues[channel];
        }
    });
});