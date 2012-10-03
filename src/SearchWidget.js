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
 * SearchWidget is a base widget that provides a search area and placeholder/watermark text. It also listens for
 * keyboard enter/return and passes the search expression to {@link #onQuery onQuery} which should be connected to in
 * the view.
 *
 * @alternateClassName SearchWidget
 * @mixins _TemplatedWidgetMixin
 */
define('argos/SearchWidget', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/event',
    'dojo/string',
    'dojo/html',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    './_TemplatedWidgetMixin'
], function(
    declare,
    lang,
    event,
    string,
    html,
    domClass,
    _WidgetBase,
    _TemplatedWidgetMixin
) {
    return declare('argos.SearchWidget', [_WidgetBase, _TemplatedWidgetMixin], {
        _setLabelAttr: {node: 'labelNode', type: 'innerHTML'},
        _setQueryValueAttr: { node: 'queryNode', type: 'attribute', attribute: 'value' },
        /**
         * @property {Simplate}
         * Simple that defines the HTML Markup
         */
        widgetTemplate: new Simplate([
            '<div class="search-header">',
                '<input type="text" id="search-{%= $$.id %}" name="query" class="query" autocorrect="off" autocapitalize="off" data-dojo-attach-point="queryNode" data-dojo-attach-event="onfocus:_onFocus,onblur:_onBlur,onkeypress:_onKeyPress" />',
                '<button class="search-clear" data-dojo-attach-event="onclick: _onClearClick"></button>',
                '<button class="search-button sub-header-button" data-dojo-attach-event="click: search"><div><span>{%= $.searchText %}</span></div></button>',
                '<label data-dojo-attach-point="labelNode" for="search-{%= $$.id %}">{%= $.searchText %}</label>',
            '</div>'
        ]),

        /**
         * @property {String}
         * Text that is used when no value is in the search box - "placeholder" text.
         */
        searchText: 'Search',

        queryNode: null,

        /**
         * Sets search text to empty and removes active styling
         */
        clear: function() {
            domClass.remove(this.domNode, 'search-active');

            this.set('queryValue', '');

            this.onClear();
        },
        /**
         * This function is invoked from the search button and it:
         *
         * * Gathers the inputted search text; and
         * * Fires the {@link #onQuery onQuery} event which {@link List#_onSearchQuery List} listens to by default.
         */
        search: function() {
            var query = this.queryNode.value;

            this.onQuery(query);
        },
        /**
         * Sets the search placeholder/watermark text
         * @param {String} text Text to be shown when no value is entered
         */
        setLabel: function(text) {
            this.set('label', text);
        },
        /**
         * Event that is fired on search, a View should bind this function to a listener.
         * @param {String} query Search text inputted
         */
        onQuery: function(query) {
        },
        /**
         * Event that is fired on clear, a View may listen to this event.
         */
        onClear: function() {
        },
        /**
         * Clears the search input text and attempts to re-open the keyboard
         * @param {Event} evt Click event
         */
        _onClearClick: function(evt){
            event.stop(evt);
            this.clear();
            this.queryNode.focus();
            this.queryNode.click();
        },
        /**
         * Tests to see if the search input is empty and toggles the active styling
         */
        _onBlur: function() {
            domClass.toggle(this.domNode, 'search-active', !!this.queryNode.value);
        },
        /**
         * Adds the search active styling
         */
        _onFocus: function() {
            domClass.add(this.domNode, 'search-active');
        },
        /**
         * Detects the enter/return key and fires {@link #search search}
         * @param {Event} evt Key press event
         */
        _onKeyPress: function(evt) {
            if (evt.keyCode == 13 || evt.keyCode == 10)
            {
                event.stop(evt);
                this.queryNode.blur();
                this.search();
            }
        }
    });
});