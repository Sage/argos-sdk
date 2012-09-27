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
 * _TemplatedWidgetMixin
 * @alternateClassName _TemplatedWidgetMixin
 */
define('argos/_TemplatedWidgetMixin', [
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/_TemplatedMixin'
], function(
    declare,
    domConstruct,
    _TemplatedMixin
) {
    return declare('argos._TemplatedWidgetMixin', null, {
        widgetTemplate: null,
        constructor: function(){
            this._attachPoints = [];
            this._attachEvents = [];
        },
        /**
         * Processes `this.widgetTemplate` or `this.contentTemplate`
         */
        buildRendering: function() {
            var rendered = this.widgetTemplate.apply(this),
                node = domConstruct.toDom(rendered);

            if (node.nodeType === 11)
                node = domConstruct.toDom('<div>' + rendered + '</div>');

            if (node.nodeType !== 1) throw new Error('Invalid template.');

            this.domNode = node;

            // Call down to _Widget.buildRendering() to get base classes assigned
            // TODO: change the baseClass assignment to _setBaseClassAttr
            this.inherited(arguments);

            // recurse through the node, looking for, and attaching to, our
            // attachment points and events, which should be defined on the template node.
            this._attachTemplateNodes(node, function(n,p){ return n.getAttribute(p); });

            this._beforeFillContent();		// hook for _WidgetsInTemplateMixin

            this._fillContent(this.srcNodeRef);
        },
        /**
         * Since there is no way to directly override only the template rendering in Dojo, include
         * the necessary functions from `_TemplatedMixin` in order to minimize the amount of code that
         * needs to be updated when Dojo itself is updated.
         */
        _beforeFillContent: _TemplatedMixin.prototype._beforeFillContent,
        _fillContent: _TemplatedMixin.prototype._fillContent,
        _attachTemplateNodes: _TemplatedMixin.prototype._attachTemplateNodes,
        destroyRendering: _TemplatedMixin.prototype.destroyRendering
    });
});