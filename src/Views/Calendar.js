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
 * Calendar
 * @alternateClassName Calendar
 * @extends View
 * @requires CalendarWidget
 */
define('argos/Calendar', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/connect',
    'dojo/_base/Deferred', /* todo: use `dojo/when` in 1.8 */
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/dom-style',
    'dojo/string',
    '../View',
    '../CalendarWidget'
], function(
    declare,
    lang,
    connect,
    Deferred,
    domClass,
    domConstruct,
    domGeom,
    domStyle,
    string,
    View,
    CalendarWidget
) {
    return declare('argos.Views.Calendar', [View], {
        events: {
            'click': true
        },
        components: [
            {name: 'calendarWidget', type: CalendarWidget}
        ],
        baseClass: 'view calendar',
        contentNode: null,

        id: 'scroll-calendar',
        tier: 0,

        titleText: 'Calendar',

        onStartup: function() {
            this.inherited(arguments);
            this.subscribe('/app/refresh', this._onRefresh);
        },
        refreshRequiredFor: function(options) {
            // refresh if widget is not rendered
            if (!this.$.calendarWidget._baseRendered)
                return true;
            else return this.inherited(arguments);
        },
        load: function() {
            console.log('refresh');
            this.$.calendarWidget.renderBase();
        },
        createToolLayout: function() {
            return this.tools || (this.tools = {
                'top': []
            });
        },
        onContentChange: function() {
        }
    });
});