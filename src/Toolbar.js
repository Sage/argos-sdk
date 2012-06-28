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
    'dojo/query',
    'dojo/NodeList-manipulate',
    'dojo/topic',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dijit/_WidgetBase',
    './_EventMapMixin',
    './_UiComponent',
    './Utility'
], function(
    declare,
    lang,
    query,
    nodeListManipulate,
    topic,
    domConstruct,
    domStyle,
    domClass,
    domAttr,
    _WidgetBase,
    _EventMapMixin,
    _UiComponent,
    utility
) {
    return declare('Sage.Platform.Mobile.Toolbar', [_WidgetBase, _EventMapMixin, _UiComponent], {
        events: {
            '.tool-button:click': '_onToolClick'
        },
        baseClass: 'toolbar',
        position: 'top',
        components: [
            {tag: 'h1', attrs: {'class':'toolbar-title'}, attachPoint: 'titleNode'}
        ],
        itemTemplate: new Simplate([
            '<button class="button tool-button {%= $$.cls %}"',
                    'data-tool="{%= $.name %}" aria-label="{%: $$.title || $.name %}">',
                '{% if ($$.icon) { %}',
                '<img src="{%= $$.icon %}" alt="{%= $.name %}" />',
                '{% } else { %}',
                '<span></span>',
                '{% } %}',
            '</button>'
        ]),
        items: null,
        _setTitleAttr: {node: 'titleNode', type: 'innerHTML'},
        _size: null,
        _items: null,
        _itemsByName: null,
        _onToolClick: function(evt, node) {
            var name = domAttr.get(node, 'data-tool');
            if (name) this._invokeTool(name);
        },
        _invokeTool: function(name) {
            var item = this._items[name],
                source = item && item.source;
            if (source)
            {
                if (source.fn)
                {
                    source.fn.call(source.scope || this, source);
                }
                else if (source.action)
                {
                    var root = this.getComponentRoot(),
                        method = root[source.action];

                    if (typeof method === 'function') method.call(root, source);
                }
                else if (source.publish)
                {
                    topic.publish(source.publish, [source]);
                }
            }
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
        onPositionChange: function(position, previous) {
        },
        onCreate: function() {
            this.inherited(arguments);
            this.onPositionChange(this.position, null);
        },
        clear: function() {
            this._remove();

            this._items = {};
        },
        update: function() {
            var count = {left: 0, right: 0};

            for (var name in this._items)
            {
                var item = this._items[name];

                this._update(item);

                if (item.visible) count[item.side] += 1;

                this._sync(item);
            }

            domAttr.set(this.domNode, 'data-item-count', Math.max(count['left'], count['right']));
        },
        _render: function(item) {
            var node = domConstruct.toDom(this.itemTemplate.apply(item, item.source));

            item.domNode = node;

            domClass.add(node, 'on-' + item.side);

            this._sync(item);

            domConstruct.place(node, this.domNode);

            return node;
        },
        _update: function(item) {
            var source = item.source,
                visible = utility.expand(this, source.visible),
                enabled = utility.expand(this, source.enabled);

            item.visible = typeof visible !== 'undefined' ? visible : true;
            item.enabled = typeof enabled !== 'undefined' ? enabled : true;
        },
        _sync: function(item) {
            var node = item.domNode;

            domClass.toggle(node, 'is-disabled', !item.enabled);
            domClass.toggle(node, 'is-hidden', !item.visible);
        },
        _remove: function() {
            query("> .tool", this.domNode).remove();
        },
        _setItemsAttr: function(values) {
            var items = {},
                count = {left: 0, right: 0};

            if (typeof values == 'undefined') return;

            this._remove();

            for (var i = 0; i < values.length; i++) {
                var source = values[i],
                    item = {
                        domNode: null,
                        name: source.name || source.id,
                        side: source.side || 'right',
                        busy: false,
                        visible: true,
                        enabled: true,
                        source: source
                    };

                this._update(item);

                if (item.visible) count[item.side] += 1;

                this._render(item);

                items[item.name] = item;
            }

            /* todo: track each side seprately? */
            domAttr.set(this.domNode, 'data-tool-count', Math.max(count['left'], count['right']));

            this._items = items;
        },
        _getItemsAttr: function() {
            return this._items;
        }
    });
});