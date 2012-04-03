define([
    'dojo/on',
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/dom-attr',
    'dojo/query' /* required for delegation */
], function(on, declare, array, lang, domAttr, query) {
    var proxy = function(fn, scope) {
        return function(evt) {
            /* `this` is the matched element for delegation */
            fn.call(scope, evt, this);
        };
    };

    /**
     * Allows a widget to map events to actions by defining an event map.
     */
    return declare('Sage._EventMapMixin', null, {
        /**
         * Can be in the form:
         *   * `'<event>': '<action>'`
         *   * `'<selector>:<event>': '<action>'`
         *   * `'<name>': { selector: '<selector>', event: <extension event>, action: '<action>' }`
         */
        events: null,
        _eventSignals: null,
        postCreate: function() {
            this.inherited(arguments);

            this._eventSignals = (this._eventSignals || []);

            if (this.events)
            {
                for (var name in this.events)
                {
                    var item = this.events[name];
                    if (item)
                    {
                        var event = null,
                            fn = null;

                        if (lang.isObject(item))
                        {
                            event = item.selector
                                ? on.selector(item.selector, item.event || name)
                                : item.event || name;
                            fn = lang.isFunction(this[item.action])
                                ? this[item.action]
                                : this._invokeDynamicAction;
                        }
                        else
                        {
                            event = name;
                            fn = lang.isFunction(this[item])
                                ? this[item]
                                : this._invokeDynamicAction;
                        }

                        this._eventSignals.push(
                            on(this.domNode, event, proxy(fn, this))
                        );
                    }
                }
            }
        },
        _invokeDynamicAction: function(evt, node) {
            var action = domAttr.get(node, 'data-action'),
                fn = lang.isFunction(this[action]) ? this[action] : null;
            if (fn) fn.call(this, evt, node);
        },
        uninitialize: function() {
            this.inherited(arguments);

            array.forEach(this._eventSignals, function(signal) {
                signal.remove();
            });
        }
    });
});