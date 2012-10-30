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
 * CommandMixin provides a way to invoke javascript functions from HTML markup.
 *
 * The object/class that mixes this in sure bind the click event to `_CommandMixin.invoke` which will handle the rest.
 *
 * On the HTML side of things add `data-command="functionName"`.
 *
 * The CommandMixin will match the named function with the id (or name) stored in the
 * `_commandsByName` hash. From there it will invoke the appropiate supported method:
 *
 * * fn: An inline function definition
 * * show: Calls scene().showView with the given show string
 * * action: Name of function in the given scope to call
 * * publish: Calls topic.publish() with the publish string as the topic and `args` as the passed arguments
 *
 * Example:
 *
 * HTML
 *     <div data-command="new"><img src="new.png"></div>
 *
 * javascript
 *
 *     this._commandsByName['new'] = {
 *         action: 'navigateToInsertView'
 *         scope: this
 *     });
 *
 *
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
        /**
         * @property {Object[]}
         * Collection of command objects, where the key is the command name and value is the object.
         */
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

        /**
         * Click handler, extracts the data-command from the clicked node and invokes the command by name
         * @param evt
         * @param node
         */
        invoke: function(evt, node) {
            var name = typeof evt === 'string'
                    ? evt
                    : node && domAttr.get(node, 'data-command'),
                command = this._commandsByName[name];
            if (command) this._invokeCommand(command);
        },

        /**
         * Calls the appropriate function based on what the command object has.
         *
         * Order that it detects the function (first -> last):
         *
         *     fn, show, action, publish
         *
         * Note if the `commandObject.enabled` is false, or `.disabled` is true the invoke is cancelled.
         *
         * @param command
         */
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