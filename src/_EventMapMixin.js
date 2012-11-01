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
 * EventMapMixin allows a widget to map events to actions by defining an event map.
 *
 * EventMapMixin is really made of two parts: the event map to dojo/on connections and
 * the handling of "dynamic events".
 *
 * The first part is fairly straight forward, see the `events` config for the variations.
 *
 * The second part comes into play when you set an event handler to `true`:
 *
 *     events: {'click': true}
 *
 * In which the HTMLElement that initiated the event will have it's `data-action` attribute extracted
 * and called passing the original event and node as parameters.
 *
 * @alternateClassName _EventMapMixin
 */
define('argos/_EventMapMixin', [
    'dojo/on',
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/event',
    'dojo/dom-attr',
    'dojo/query' /* required for delegation */,
    'dojo/NodeList-traverse'
], function(on, declare, array, lang, event, domAttr, query, nodeListTraverse) {
    var proxy = function(fn, scope) {
        return function(evt) {
            /* `this` is the matched element for delegation */
            fn.call(scope, evt, this);
        };
    };

    return declare('argos._EventMapMixin', null, {
        /**
         * @cfg {String/Object}
         * Can be in the form:
         *   * `'<event>': '<action>'`
         *   * `'<selector>:<event>': '<action>'`
         *   * `'<name>': { selector: '<selector>', event: <extension event>, action: '<action>' }`
         */
        events: null,
        _eventSignals: null,
        startup: function() {
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
                                : this._handleDynamicEvent;
                        }
                        else
                        {
                            event = name;
                            fn = lang.isFunction(this[item])
                                ? this[item]
                                : this._handleDynamicEvent;
                        }

                        this._eventSignals.push(
                            on(this.domNode, event, proxy(fn, this))
                        );
                    }
                }
            }
        },
        _handleDynamicEvent: function(evt) {
            var node = query(evt.target).closest('[data-action]')[0],
                action = node && domAttr.get(node, 'data-action');

            var contained = this.domNode.contains
                ? this.domNode != node && this.domNode.contains(node)
                : !!(this.domNode.compareDocumentPosition(node) & 16);

            if (action && this._hasDynamicAction(action) && (contained || this.domNode === node))
            {
                this._invokeDynamicAction(action, evt, node);

                event.stop(evt);
            }
        },
        _hasDynamicAction: function(name) {
            return lang.isFunction(this[name]);
        },
        _invokeDynamicAction: function(name, evt, node) {
            var fn = this[name];
            if (fn) fn.call(this, evt, node);
        },
        uninitialize: function() {
            this.inherited(arguments);

            array.forEach(this._eventSignals, function(signal) {
                signal.remove();
            });

            delete this._eventSignals;
        }
    });
});