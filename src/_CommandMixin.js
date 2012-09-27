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
 * _CommandMixin
 * @alternateClassName _CommandMixin
 * @requires utility
 * @requires scene
 */
define('argos/_CommandMixin', [
    'dojo/_base/declare',
    'dojo/dom-attr',
    'dojo/topic',
    './utility',
    'argos!scene'
], function(
    declare,
    domAttr,
    topic,
    utility,
    scene
) {
    /* todo: convert toolbar to use this */
    return declare('argos._CommandMixin', null, {
        _commandsByName: null,

        context: null,

        constructor: function() {
            this._commandsByName = {};
        },
        _getContextAttr: function() {
            if (this.context) return this.context;

            return this;
        },
        _setContextAttr: function(value) {
            this.context = value;
        },
        invoke: function(evt, node) {
            var name = typeof evt === 'string'
                    ? evt
                    : node && domAttr.get(node, 'data-command'),
                command = this._commandsByName[name];
            if (command) this._invokeCommand(command);
        },
        _invokeCommand: function(command) {
            var context = this.get('context'),
                scope = command.scope || context || command,
                args = utility.expandSafe(command, command.args, command, context, this) || [];

            if (command.enabled === false || command.disabled === true)
                return;

            if (command.fn)
            {
                command.fn.apply(scope, args.concat(context, command));
            }
            else if (command.show)
            {
                scene().showView.apply(scene(), [command.show].concat(args));
            }
            else if (command.action)
            {
                var method = scope && scope[command.action];

                if (typeof method === 'function') method.apply(scope, args.concat(context, command));
            }
            else if (command.publish)
            {
                topic.publish.apply(topic, [command.publish].concat(args, context, command));
            }
        }
    });
});