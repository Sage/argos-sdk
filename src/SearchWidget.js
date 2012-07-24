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
    return declare('Sage.Platform.Mobile.SearchWidget', [_WidgetBase, _TemplatedWidgetMixin], {
        _setLabelAttr: {node: 'labelNode', type: 'innerHTML'},
        _setQueryValueAttr: { node: 'queryNode', type: 'attribute', attribute: 'value' },
        widgetTemplate: new Simplate([
            '<div class="search-header">',
                '<input type="text" id="search-{%= $$.id %}" name="query" class="query" autocorrect="off" autocapitalize="off" data-dojo-attach-point="queryNode" data-dojo-attach-event="onfocus:_onFocus,onblur:_onBlur,onkeypress:_onKeyPress" />',
                '<button class="search-clear" data-dojo-attach-event="onclick: _onClearClick"></button>',
                '<button class="search-button sub-header-button" data-dojo-attach-event="click: search"><span>{%= $.searchText %}</span></button>',
                '<label data-dojo-attach-point="labelNode" for="search-{%= $$.id %}">{%= $.searchText %}</label>',
            '</div>'
        ]),
        
        searchText: 'Search',

        queryNode: null,

        clear: function() {
            domClass.remove(this.domNode, 'search-active');

            this.set('queryValue', '');

            this.onClear();
        },
        search: function() {
            var query = this.queryNode.value;

            this.onQuery(query);
        },
        setLabel: function(text) {
            this.set('label', text);
        },
        onQuery: function(query) {
        },
        onClear: function() {
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
        }
    });
});