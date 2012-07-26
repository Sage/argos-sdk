define('Sage/Platform/Mobile/_CommandMixin', [
    'dojo/_base/declare',
    'dojo/dom-attr',
    'dojo/topic',
    './Utility',
    'argos!scene'
], function(
    declare,
    domAttr,
    topic,
    utility,
    scene
) {
    /* todo: convert toolbar to use this */
    return declare('Sage.Platform.Mobile._CommandMixin', null, {
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