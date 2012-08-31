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
 * _ActionMixin provides a click listener to the `domNode` of view it is mixed into.
 *
 * When a click event is caught by the handler it finds the closest element with `data-action`
 * and fires that function in the context of the view. When calling the function it passes a `params`
 * object with the following:
 *
 *     {
 *         $event: 'Original click event',
 *         $src: 'The HTML node that initiated the event'
 *     }
 *
 * and then it mixes it all the `data-` attributes from the node into the params object.
 *
 * @alternateClassName _ActionMixin
 */
define('Sage/Platform/Mobile/_ActionMixin', [
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/event',
    'dojo/dom-attr',
    'dojo/query',
    'dojo/NodeList-traverse'
], function(
    array,
    declare,
    event,
    domAttr,
    query
) {

    return declare('Sage.Platform.Mobile._ActionMixin', null, {
        /**
         * @property {String}
         * Comma separated (no spaces) list of events to listen to
         */
        actionsFrom: 'click',
        /**
         * Extends the dijit Widget `postCreate` to connect to all events defined in `actionsFrom`.
         */
        postCreate: function() {
            // todo: add delegation
            array.forEach(this.actionsFrom.split(','), function(event) {
                this.connect(this.domNode, event, this._initiateActionFromEvent);
            }, this);
        },
        /**
         * Verifies that the given HTML element is within our view.
         * @param {HTMLElement} el
         * @return {Boolean}
         */
        _isValidElementForAction: function(el) {
            var contained = this.domNode.contains
                ? this.domNode != el && this.domNode.contains(el)
                : !!(this.domNode.compareDocumentPosition(el) & 16);

            return (this.domNode === el) || contained;
        },
        /**
         * Takes an event and fires the closest valid `data-action` with the attached `data-` attributes
         * @param {Event} evt
         */
        _initiateActionFromEvent: function(evt) {
            var el = query(evt.target).closest('[data-action]')[0],
                action = el && domAttr.get(el, 'data-action');

            if (action && this._isValidElementForAction(el) && this.hasAction(action, evt, el))
            {
                var parameters = this._getParametersForAction(action, evt, el);

                this.invokeAction(action, parameters, evt, el);

                event.stop(evt);
            }
        },
        /**
         * Extracts the `data-` attributes of an element and adds `$event` and `$source` being the two originals values.
         * @param {String} name Name of the action/function being fired.
         * @param {Event} evt The original event
         * @param {HTMLElement} el The node that has the `data-action` attribute
         * @return {Object} Object with the original event and source along with all the `data-` attributes in pascal case.
         */
        _getParametersForAction: function(name, evt, el) {
            var parameters = {
                $event: evt,
                $source: el
            };

            for (var i = 0, attrLen = el.attributes.length; i < attrLen; i++)
            {
                var attributeName = el.attributes[i].name;
                if (/^((?=data-action)|(?!data))/.test(attributeName)) continue;

                /* transform hyphenated names to pascal case, minus the data segment, to be in line with HTML5 dataset naming conventions */
                /* see: http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data */
                /* todo: remove transformation and use dataset when browser support is there */
                var parameterName = attributeName.substr('data-'.length).replace(/-(\w)(\w+)/g, function($0, $1, $2) { return $1.toUpperCase() + $2; });

                parameters[parameterName] = domAttr.get(el, attributeName);
            }

            return parameters;
        },
        /**
         * Determines if the view contains a function with the given name
         * @param {String} name Name of function being tested.
         * @param evt
         * @param el
         * @return {Boolean}
         */
        hasAction: function(name, evt, el) {
            return (typeof this[name] === 'function');
        },
        /**
         * Calls the given function name in the context of the view passing
         * the {@link #_getParametersForAction parameters gathered} and the event and element.
         * @param {String} name Name of function being invoked.
         * @param {Object} parameters Collection of `data-` attributes from the element.
         * @param {Event} evt The event that fired
         * @param {HTMLElement} el The HTML element that has the `data-action`
         */
        invokeAction: function(name, parameters, evt, el) {
            return this[name].apply(this, [parameters, evt, el]);
        }
    });

});
