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

define('Sage/Platform/Mobile/SearchWidget', [
    'dojo',
    'dijit/_Widget',
    'Sage/Platform/Mobile/_Templated'
], function() {
    return dojo.declare('Sage.Platform.Mobile.SearchWidget', [dijit._Widget, Sage.Platform.Mobile._Templated], {
        attributeMap: {
            queryValue: { node: 'queryNode', type: 'attribute', attribute: 'value' }
        },
        widgetTemplate: new Simplate([
            '<div class="search-widget">',
            '<input type="text" name="query" class="query" autocorrect="off" autocapitalize="off" data-dojo-attach-point="queryNode" data-dojo-attach-event="onfocus:_onFocus,onblur:_onBlur,onkeypress:_onKeyPress" />',
            '<button class="clear-button" data-dojo-attach-event="onclick: _onClearClick"></button>',
            '<button class="subHeaderButton searchButton" data-dojo-attach-event="click: search">{%= $.searchText %}</button>',
            '<label data-dojo-attach-point="labelNode">{%= $.searchText %}</label>',
            '</div>'
        ]),
        searchText: 'Search',
        queryNode: null,

        clear: function() {
            dojo.removeClass(this.domNode, 'search-active');
            this.set('queryValue', '');
        },
        search: function() {
            var customMatch = query && this.customSearchRE.exec(query),
                hashTagMatches = query && this.hashTagSearchRE.exec(query),
                query = this.queryNode.value;

            if (customMatch)
            {
                query = query.replace(this.customSearchRE, '');
            }
            else if (hashTagMatches && this.hashTagQueries)
            {
                var hashLookup = {},
                    hashQueries = [],
                    hashQueryExpression,
                    match,
                    hashTag,
                    additionalSearch = query.replace(hashTagMatches[0],'');

                // localize
                for (var key in this.hashTagQueriesText) hashLookup[this.hashTagQueriesText[key]] = key;

                // add initial hash caught for if test
                hashTag = hashTagMatches[1];
                hashQueryExpression = this.hashTagQueries[hashLookup[hashTag] || hashTag];
                hashQueries.push(this.expandExpression(hashQueryExpression));

                while (match = this.hashTagSearchRE.exec(query))
                {
                    hashTag = match[1];

                    hashQueryExpression = this.hashTagQueries[hashLookup[hashTag] || hashTag];
                    hashQueries.push(this.expandExpression(hashQueryExpression));

                    additionalSearch = additionalSearch.replace(match[0], '');
                }

                query = '(' + hashQueries.join(') and (') + ')';

                additionalSearch = additionalSearch.replace(/^\s+|\s+$/g, '');

                if (additionalSearch != '') query += ' and (' + this.formatSearchQuery(additionalSearch) + ')';
            }
            else if (query)
            {
                query = this.formatSearchQuery(query);
            }

            this.onSearchExpression(query, this);
        },
        _onClearClick: function(evt){
            dojo.stopEvent(evt);
            this.clear();
            this.queryNode.focus();
            this.queryNode.click();
        },
        _onBlur: function() {
            dojo.toggleClass(this.domNode, 'search-active', !!this.queryNode.value);
        },
        _onFocus: function() {
            dojo.addClass(this.domNode, 'search-active');
        },
        _onKeyPress: function(evt) {
            if (evt.keyCode == 13 || evt.keyCode == 10)
            {
                dojo.stopEvent(evt);

                this.queryNode.blur();

                this.search();
            }
        },
        escapeSearchQuery: function(query) {
            return (query || '').replace(/"/g, '""');
        },
        /**
         * The event that fires when the search widget provides an explicit search query
         * @param expression
         * @param widget
         */
        onSearchExpression: function(expression, widget) {

        }
    });
});