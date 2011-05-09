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

Ext.namespace('Sage.Platform.Mobile');

(function() {
    Sage.Platform.Mobile.GroupedList = Ext.extend(Sage.Platform.Mobile.List, {
        attachmentPoints: Ext.apply({}, {
            contentEl: '.group-content'
        }, Sage.Platform.Mobile.List.prototype.attachmentPoints),
        viewTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%= $.titleText %}" class="list grouped-list {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
            '{%! $.searchTemplate %}',
            '<a href="#" class="android-6059-fix">fix for android issue #6059</a>',
            '<div class="group-content"></div>',
            '{%! $.moreTemplate %}',
            '</div>'
        ]),
        groupTemplate: new Simplate([
            '<h2 data-action="toggleGroup" class="{% if ($.collapsed) { %}collapsed{% } %}">',
            '{%: $.title %}<button class="collapsed-indicator" aria-label="{%: $$.toggleCollapseText %}"></button>',
            '</h2>',
            '<ul data-group="{%= $.tag %}" class="list-content {%= $.cls %}"></ul>'
        ]),
        toggleCollapseText: 'toggle collapse',
        getGroupForEntry: function(entry) {
            return {
                tag: 1,
                title: 'Default'
            };
        },
        toggleGroup: function(params) {
            var el = Ext.get(params.$source);
            if (el)
                el.toggleClass('collapsed');
        },
        processFeed: function(feed) {
            /// <summary>
            ///     Processes the feed result from the SData request and renders out the resource feed entries.
            /// </summary>
            /// <param name="feed" type="Object">The feed object.</param>
            if (!this.feed) this.contentEl.update('');

            this.feed = feed;

            if (this.feed['$totalResults'] === 0)
            {
                Ext.DomHelper.append(this.contentEl, this.noDataTemplate.apply(this));
            }
            else if (feed['$resources'])
            {
                var o = [];

                for (var i = 0; i < feed['$resources'].length; i++)
                {
                    var entry = feed['$resources'][i],
                        entryGroup = this.getGroupForEntry(entry);

                    if (entryGroup.tag != this.currentGroup)
                    {
                        if (o.length > 0)
                            Ext.DomHelper.append(this.currentGroupEl, o.join(''));

                        o = [];

                        this.currentGroup = entryGroup.tag;
                        this.currentGroupEl = Ext.DomHelper.append(this.contentEl, this.groupTemplate.apply(entryGroup, this), true);
                    }

                    this.entries[entry.$key] = entry;

                    o.push(this.itemTemplate.apply(entry, this));
                }

                if (o.length > 0)
                    Ext.DomHelper.append(this.currentGroupEl, o.join(''));
            }

            if (this.remainingEl)
                this.remainingEl.update(String.format(
                    this.remainingText,
                    this.feed['$totalResults'] - (this.feed['$startIndex'] + this.feed['$itemsPerPage'] - 1)
                ));

            if (this.hasMoreData())
                this.el.addClass('list-has-more');
            else
                this.el.removeClass('list-has-more');
        },
        clear: function() {
            Sage.Platform.Mobile.GroupedList.superclass.clear.apply(this, arguments);

            this.currentGroup = false;
            this.currentGroupEl = false;
        }
    });
})();
