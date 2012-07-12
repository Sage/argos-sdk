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

define('Sage/Platform/Mobile/GroupedList', [
    'dojo/_base/declare',
    'dojo/query',
    'dojo/string',
    'dojo/dom-class',
    'dojo/dom-construct',
    'Sage/Platform/Mobile/List'
], function(
    declare,
    query,
    string,
    domClass,
    domConstruct,
    List
) {

    return declare('Sage.Platform.Mobile.GroupedList', [List], {
        baseClass: 'view list list-grouped has-search-header',
        groupTemplate: new Simplate([
            '<h2 data-action="toggleGroup" class="{% if ($.collapsed) { %}collapsed{% } %} {% if ($.title === false) { %}hidden-section{% } %}">',
            '{%: $.title %}<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '<ul data-group="{%= $.tag %}" class="list-content"></ul>'
        ]),
        _currentGroup: null,
        _currentGroupNode: null,
        // Localization
        toggleCollapseText: 'toggle collapse',
        getGroupForItem: function(item) {
            return {
                tag: 1,
                title: 'Default'
            };
        },
        toggleGroup: function(evt, node) {
            if (node) domClass.toggle(node, 'is-collapsed');

            this.onContentChange();
        },
        _processData: function(items) {
            var store = this.get('store'),
                count = items.length;
            if (count > 0)
            {
                var output = [];

                for (var i = 0; i < count; i++)
                {
                    var item = this._processItem(items[i]),
                        itemGroup = this.getGroupForItem(item);

                    this.items[store.getIdentity(item)] = item;

                    if (itemGroup.tag != this._currentGroup)
                    {
                        if (output.length > 0 && this._currentGroupNode) domConstruct.place(output.join(''), this._currentGroupNode, 'last');

                        output = [];

                        this._currentGroup = itemGroup.tag;
                        domConstruct.place(this.groupTemplate.apply(itemGroup, this), this.contentNode, 'last');
                        this._currentGroupNode = query("> :last-child", this.contentNode)[0];
                    }

                    output.push(this.rowTemplate.apply(item, this));
                }

                if (output.length > 0 && this._currentGroupNode) domConstruct.place(output.join(''), this._currentGroupNode, 'last');
            }
        },
        clear: function() {
            this.inherited(arguments);

            this._currentGroup = null;
            this._currentGroupNode = null;
        }
    });
});
