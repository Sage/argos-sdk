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

define('Sage/Platform/Mobile/Toolbar', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/topic',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    './_EventMapMixin',
    './_UiComponent',
    './ToolbarButton',
    './Utility',
    'argos!scene'
], function(
    declare,
    lang,
    array,
    topic,
    domAttr,
    domClass,
    _WidgetBase,
    _EventMapMixin,
    _UiComponent,
    ToolbarButton,
    utility,
    scene
) {
    return declare('Sage.Platform.Mobile.Toolbar', [_WidgetBase, _EventMapMixin, _UiComponent], {
        events: {
            'click': true
        },
        baseClass: 'toolbar',
        position: 'top',
        items: null,
        context: null,
        visible: true,
        _size: 0,
        _items: null,
        _itemsByName: null,

        invoke: function(evt, node) {
            var name = node && domAttr.get(node, 'data-tool'),
                item = name && this._itemsByName[name];
            if (item)
            {
                var context = this.get('context'),
                    scope = item.scope || context || this,
                    args = utility.expand(item, item.args, context, item) || [];

                if (item.fn)
                {
                    item.fn.apply(scope, args.concat(item));
                }
                else if (item.show)
                {
                    scene().showView(item.show, args);
                }
                else if (item.action)
                {
                    var method = scope && scope[item.action];

                    if (typeof method === 'function') method.apply(scope, args.concat(item));
                }
                else if (item.publish)
                {
                    topic.publish.apply(topic, [item.publish].concat(args, item));
                }
            }
        },
        _getContextAttr: function() {
            if (this.context) return this.context;

            var parent = this.getParent();

            return parent && parent.active;
        },
        _setContextAttr: function(value) {
            this.context = value;
        },
        _getPositionAttr: function() {
            return this.position;
        },
        _setPositionAttr: function(value) {
            var previous = this.position;

            domClass.remove(this.domNode, 'toolbar-' + previous);
            domClass.add(this.domNode, 'toolbar-' + value);

            this.position = value;

            this.onPositionChange(value, previous);
        },
        _setVisibleAttr: function(value) {
            this.visible = value;

            domClass.toggle(this.domNode, 'is-hidden', !value);
        },
        _getVisibleAttr: function() {
            return this.visible;
        },
        onPositionChange: function(position, previous) {
        },
        onStartup: function() {
            this.inherited(arguments);
            this.onPositionChange(this.position, null);
        },
        clear: function() {
            this._empty();

            this._items = [];
            this._itemsByName = {};
        },
        hide: function() {
            this.set('visible', false);
        },
        show: function() {
            this.set('visible', true);
        },
        update: function() {
            var context = this.get('context'),
                count = {left: 0, right: 0};

            array.forEach(this._items, function(item) {
                item.update(context);

                if (item.get('visible')) count[item.get('side')] += 1;
            }, this);

            var size = Math.max(count['left'], count['right']);

            domAttr.set(this.domNode, 'data-item-count', size);

            this._size = size;

            this.onContentChange();
        },
        _empty: function() {
            if (this._items)
            {
                array.forEach(this._items, function(item) {
                    item.remove();
                });

                this.onContentChange();
            }
        },
        _setItemsAttr: function(values, options) {
            /* todo: use options for animation, caching */
            /* cache per key and exact object */

            if (typeof values == 'undefined') return;

            var context = this.get('context'),
                count = {left: 0, right: 0},
                key = options && options.key,
                itemsByName = {},
                items = array.map(values, function(value) {

                    /* support old tool definitions */
                    value.name = value.name || value.id;

                    /* right now we only support button items */
                    var item = new ToolbarButton(value);

                    item.update(context);

                    if (item.get('visible')) count[item.get('side')] += 1;

                    item.placeAt(this.containerNode || this.domNode);

                    itemsByName[item.get('name')] = item;

                    return item;
                }, this);

            var size = Math.max(count['left'], count['right']);

            /* todo: track each side separately? */
            domAttr.set(this.domNode, 'data-tool-count', size);

            this._size = size;
            this._items = items;
            this._itemsByName = itemsByName;

            this.onContentChange();
        },
        _getItemsAttr: function() {
            return this._items;
        },
        onContentChange: function() {
        }
    });
});