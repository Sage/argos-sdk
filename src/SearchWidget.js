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
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/event',
    'dojo/string',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    './_TemplatedWidgetMixin'
], function(
    declare,
    lang,
    event,
    string,
    domClass,
    _WidgetBase,
    _TemplatedWidgetMixin
) {
    return declare('Sage.Platform.Mobile.SearchWidget', [_WidgetBase, _TemplatedWidgetMixin], {
        attributeMap: {
            queryValue: { node: 'queryNode', type: 'attribute', attribute: 'value' }
        },
        widgetTemplate: new Simplate([
            '<div class="search-header">',
                '<input type="text" name="query" class="query" autocorrect="off" autocapitalize="off" data-dojo-attach-point="queryNode" data-dojo-attach-event="onfocus:_onFocus,onblur:_onBlur,onkeypress:_onKeyPress" />',
                '<button class="search-clear" data-dojo-attach-event="onclick: _onClearClick"></button>',
                '<button class="search-button sub-header-button" data-dojo-attach-event="click: search">{%= $.searchText %}</button>',
                '<label data-dojo-attach-point="labelNode">{%= $.searchText %}</label>',
            '</div>'
        ]),
        
        searchText: 'Search',
        
        /**
         * The regular expression used to determine if a search query is a custom search expression.  A custom search
         * expression is not processed, and directly passed to SData.
         * @type {Object}
         */
        customSearchRE: /^#!/,
        /**
         * The regular expression used to determine if a search query is a hash tag search.
         * @type {Object}
         */
        hashTagSearchRE: /(?:#|;|,|\.)(\w+)/g,
        hashTagQueries: null,
        queryNode: null,

        clear: function() {
            domClass.remove(this.domNode, 'search-active');
            this.set('queryValue', '');
        },
        search: function() {
            var searchQuery = this.queryNode.value,
                formattedQuery,
                isCustomMatch = searchQuery && this.customSearchRE.test(searchQuery),
                isHashTagMatch = searchQuery && this.hashTagSearchRE.test(searchQuery);

            switch(true) {
                case isCustomMatch: formattedQuery = this.customSearch(searchQuery);
                    break;
                case isHashTagMatch: formattedQuery = this.hashTagSearch(searchQuery);
                    break;
                default: formattedQuery = this.formatSearchQuery(searchQuery);
            }

            if (lang.trim(searchQuery) === '')
                formattedQuery = null;

            this.onSearchExpression(formattedQuery, this);
        },
        /**
         * Returns an unmodified search query which allows a user
         * to type in their own where clause
         * @param {String} query Value of search box
         * @returns {String} query Unformatted query
         */
        customSearch: function(query) {
            this.customSearchRE.lastIndex = 0;
            query = query.replace(this.customSearchRE, '');
            return query;
        },
        /**
         * Returns the search query based on a hash selector
         * Any hash tags in the search are replaced by predefined search statements
         * Remaining text not preceded by a hash will receive
         * that views normal search formatting
         * @param {String} query Value of search box
         * @returns {String} query Hash resolved query
         */
        hashTagSearch: function(query) {
            var hashLayout = this.hashTagQueries || [],
                hashQueries = [],
                additionalSearch = query;

            this.hashTagSearchRE.lastIndex = 0;

            var match;
            while (match = this.hashTagSearchRE.exec(query))
            {
                var hashTag = match[1],
                    hashQueryExpression = null;

                // todo: can optimize later if necessary
                for (var i = 0; i < hashLayout.length && !hashQueryExpression; i++)
                    if (hashLayout[i].tag == hashTag)
                        hashQueryExpression = hashLayout[i].query;

                if (!hashQueryExpression) continue;

                hashQueries.push(this.expandExpression(hashQueryExpression));
                additionalSearch = additionalSearch.replace(match[0], '');
            }

            if (hashQueries.length < 1)
                return this.formatSearchQuery(query);

            query = string.substitute('(${0})', [hashQueries.join(') and (')]);

            additionalSearch = additionalSearch.replace(/^\s+|\s+$/g, '');

            if (additionalSearch)
                query += string.substitute(' and (${0})', [this.formatSearchQuery(additionalSearch)]);

            return query;
        },
        configure: function(options) {
            // todo: for now, we simply mixin the options
            lang.mixin(this, options);
        },
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        _onClearClick: function(evt){
            event.stop(evt);
            this.clear();
            this.queryNode.focus();
            this.queryNode.click();
        },
        _onBlur: function() {
            domClass.toggle(this.domNode, 'search-active', !!this.queryNode.value);
        },
        _onFocus: function() {
            domClass.add(this.domNode, 'search-active');
        },
        _onKeyPress: function(evt) {
            if (evt.keyCode == 13 || evt.keyCode == 10)
            {
                event.stop(evt);
                this.queryNode.blur();
                this.search();
            }
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