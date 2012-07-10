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

define('Sage/Platform/Mobile/Control', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/dom-class',
    'dojo/Stateful',
    'dijit/_WidgetBase',
    './_UiComponent'
], function(
    declare,
    lang,
    domConstruct,
    domClass,
    Stateful,
    _WidgetBase,
    _UiComponent
) {
    /**
     * A lightweight replacement for _WidgetBase.
     */
    return declare('Sage.Platform.Mobile.Control', [Stateful, _UiComponent], {
        attributeMap: {},
        content: null,
        tag: null,
        attrs: null,
        baseClass: null,

        onCreate: function() {
            this.inherited(arguments);
            this.render();

            if (this.domNode) this._applyAttributes();
        },

        render: function() {
            if (this.domNode) return;

            if (this.content)
            {
                this.domNode = domConstruct.toDom(lang.isFunction(this.content) ? this.content.call(this, this) : this.content)
            }
            else
            {
                this.domNode = domConstruct.create(this.tag || 'div', this.attrs);
            }

            this.containerNode = this.domNode;

            if (this.baseClass) domClass.add(this.domNode, this.baseClass);
        },

        remove: function() {
            if (this.domNode && this.domNode.parentNode)
                this.domNode.parentNode.removeChild(this.domNode);
        },

        destroy: function() {
            this.inherited(arguments);

            if (this.domNode && this.domNode.parentNode)
                this.domNode.parentNode.removeChild(this.domNode);

            this.domNode = this.containerNode = null;
        },

        /* selective mixin from _WidgetBase */
        placeAt: _WidgetBase.prototype.placeAt,
        set: _WidgetBase.prototype.set,
        get: _WidgetBase.prototype.get,
        _set: _WidgetBase.prototype._set,
        _attrToDom: _WidgetBase.prototype._attrToDom,
        _getAttrNames: _WidgetBase.prototype._getAttrNames,
        _attrPairNames: _WidgetBase.prototype._attrPairNames,
        _applyAttributes: _WidgetBase.prototype._applyAttributes
    });
});