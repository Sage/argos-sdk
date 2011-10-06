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

define('Sage/Platform/Mobile/_ActionMixin', ['dojo', 'dojo/NodeList-traverse'], function() {

    return dojo.declare('Sage.Platform.Mobile._ActionMixin', null, {
        actionsFrom: 'click',
        postCreate: function() {
            // todo: add delegation
            dojo.forEach(this.actionsFrom.split(','), function(event) {
                this.connect(this.domNode, event, this._initiateActionFromEvent);
            }, this);
        },
        _isValidElementForAction: function(el) {
            var contained = this.domNode.contains
                ? this.domNode != el && this.domNode.contains(el)
                : !!(this.domNode.compareDocumentPosition(el) & 16);

            return (this.domNode === el) || contained;
        },
        _initiateActionFromEvent: function(evt) {
            var el = dojo.query(evt.target).closest('[data-action]')[0],
                action = el && dojo.attr(el, 'data-action'); 

            if (action && this._isValidElementForAction(el) && this.hasAction(action, evt, el))
            {
                var parameters = this._getParametersForAction(action, evt, el);

                this.invokeAction(action, parameters, evt, el);

                dojo.stopEvent(evt);
            }
        },
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

                parameters[parameterName] = dojo.attr(el, attributeName);
            }

            return parameters;
        },
        hasAction: function(name, evt, el) {
            return (typeof this[name] === 'function');
        },
        invokeAction: function(name, parameters, evt, el) {
            return this[name].apply(this, [parameters, evt, el]);
        }
    });

});
