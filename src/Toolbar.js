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
    './_CommandMixin',
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
    _CommandSupportMixin,
    ToolbarButton,
    utility,
    scene
) {
    return declare('Sage.Platform.Mobile.Toolbar', [_WidgetBase, _UiComponent, _CommandSupportMixin, _EventMapMixin], {
        events: {
            'click': true
        },
        itemType: ToolbarButton,
        baseClass: 'toolbar',
        position: 'top',
        items: null,
        context: null,
        visible: true,
        enabled: true,

        _items: null,
        _itemsByName: null,

        constructor: function() {
            this._items = [];
            this._itemsByName = {};
        },
        _getContextAttr: function() {
            if (this.context) return this.context;

            var parent = this.getParent();

            return parent && parent.active;
        },
        _setEnabledAttr: function(value) {
            this.enabled = value;
        },
        _getEnabledAttr: function() {
            return this.enabled;
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

            this.subscribe('/app/toolbar/invoke', this._onToolbarInvoke);
            this.subscribe('/app/toolbar/toggle', this._onToolbarToggle);
            this.subscribe('/app/toolbar/update', this._onToolbarUpdate);

            this.onPositionChange(this.position, null);
        },
        _onToolbarInvoke: function(name) {
            this.invoke(name);
        },
        _onToolbarToggle: function(name, value) {
            if (this.position == name) this.set('enabled', value);
        },
        _onToolbarUpdate: function(name) {
            this.update();
        },
        clear: function() {
            if (this._items.length > 0)
            {
                array.forEach(this._items, function(item) {
                    this._remove(item);
                }, this);

                this.onContentChange();

                this._items = [];
                this._itemsByName = {};

                this._commandsByName = {};
            }
        },
        hide: function() {
            this.set('visible', false);
        },
        show: function() {
            this.set('visible', true);
        },
        disable: function() {
            this.set('enabled', false);
        },
        enable: function() {
            this.set('enabled', true);
        },
        update: function() {
            var context = this.get('context');

            array.forEach(this._items, function(item) {
                this._update(item, context);
            }, this);

            this.onContentChange();
        },
        _remove: function(item) {
            item.remove();
        },
        _update: function(item, context) {
            item.update(context);
        },
        _create: function(props, key) {
            /* support old tool definitions */
            props.name = props.name || props.id;

            var ctor = props.type || this.itemType;

            delete props.type;

            return new ctor(props);
        },
        _place: function(item) {
            item.placeAt(this.containerNode || this.domNode);
        },
        _setItemsAttr: function(values, options) {
            /* todo: use options for animation, caching */
            /* todo: cache items per key and exact source object */
            if (typeof values == 'undefined') return;

            this.clear();

            var context = this.get('context'),
                key = options && options.key,
                itemsByName = {},
                items = array.map(values, function(value) {
                    var item = this._create(value, key);

                    this._update(item, context);
                    this._place(item);

                    itemsByName[item.get('name')] = item;

                    return item;
                }, this);

            this._items = items;
            this._itemsByName = itemsByName;

            this._commandsByName = itemsByName;

            this.onContentChange();
        },
        _getItemsAttr: function() {
            return this._items;
        },
        onContentChange: function() {
        }
    });
});