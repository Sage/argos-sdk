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
 * Grouped List provides a hook for grouping rows before rendering them to the page.
 * The grouping adds a container for the set of rows and is collapsible.
 * Note that it constructs the page sequentially meaning the rows should be in the correct
 * order before attempting to group.
 * @extends List
 * @alternateClassName GroupedList
 */
define('argos/GroupedList', [
    'dojo/_base/declare',
    'dojo/query',
    'dojo/string',
    'dojo/dom-class',
    'dojo/dom-construct',
    './List'
], function(
    declare,
    query,
    string,
    domClass,
    domConstruct,
    List
) {

    return declare('argos.GroupedList', [List], {
        baseClass: 'view list list-grouped has-search-header',
        /**
         * @property {Simplate}
         * Simplate that defines the Group template that includes the header element with collapse button and the row container
         */
        groupTemplate: new Simplate([
            '<h2 data-action="toggleGroup" class="{% if ($.collapsed) { %}collapsed{% } %} {% if ($.title === false) { %}hidden-section{% } %}">',
            '{%: $.title %}<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '<ul data-group="{%= $.tag %}" class="list-content"></ul>'
        ]),
        /**
         * @property {Object}
         * The current group object that is compared to the next entries group object
         * Must have a `tag` property that identifies the group.
         * The `title` property will be placed into the `groupTemplate` for the header text.
         */
        _currentGroup: null,
        _currentGroupNode: null,
        // Localization
        toggleCollapseText: 'toggle collapse',
        /**
         * Function that returns a "group object". The group object must have a tag property that is
         * based off the passed entry as it will be used to compare to other entries.
         * The title should also reflect the current entry as it will be used for the header text in the group splitter.
         *
         * An example for a Yellow Page type list:
         *
         * `entryA = {first: 'Henry', last: 'Smith', phone: '123'}`
         * `entryB = {first: 'Mary', last: 'Sue', phone: '345'}`
         *
         *     groupGroupForEntry: function(entry) {
         *         var lastInitial = entry.last.substr(0,1).toUppperCase();
         *         return {
         *             tag: lastInitial,
         *             title: lastInitial
         *         };
         *     }
         *
         * @template
         * @param {Object} entry The current entry being processed.
         * @return {Object} Object that contains a tag and title property where tag will be used in comparisons
         */
        getGroupForItem: function(item) {
            return {
                tag: 1,
                title: 'Default'
            };
        },
        /**
         * Toggles the collapsible state of the clicked group
         * @param {Object} params Object containing the event and other properties
         */
        toggleGroup: function(evt, node) {
            if (node) domClass.toggle(node, 'is-collapsed');

            this.onContentChange();
        },
        /**
         * Overrides the parent {@link List#processFeed processFeed} to introduce grouping by group tags, see {@link #getGroupForEntry getGroupForEntry}.
         * @param {Object[]} items Items to process
         */
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
        /**
         * Extends parent {@link List#clear clear} to also deletes the current group memory.
         */
        clear: function() {
            this.inherited(arguments);

            this._currentGroup = null;
            this._currentGroupNode = null;
        }
    });
});
