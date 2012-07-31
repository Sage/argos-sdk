define('Sage/Platform/Mobile/Message', [
    'dojo/_base/lang',
    'dojo/_base/array'
], function(
    lang,
    array
) {
    /* async point to point messaging */
    /* for everything else, use pub-sub */
    return lang.setObject('Sage.Platform.Mobile.Message', {
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