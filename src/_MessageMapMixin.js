define('Sage/Platform/Mobile/_MessageMapMixin', [
    'dojo/_base/declare',
    './Message'
], function(
    declare,
    message
) {
    /**
     * Allows a widget to map messages to actions by defining an message map.
     */
    return declare('Sage.Platform.Mobile._MessageMapMixin', null, {
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