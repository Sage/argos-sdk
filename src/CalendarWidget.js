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

define('Sage/Platform/Mobile/CalendarWidget', [
    'dojo/_base/declare',
    'dojo/_base/connect',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/dom-style',
    'dijit/_WidgetBase',
    './_CommandMixin',
    './_EventMapMixin',
    './_UiComponent',
    './ScrollContainer',
    './Utility'
], function (
    declare,
    connect,
    domAttr,
    domClass,
    domConstruct,
    domGeom,
    domStyle,
    _WidgetBase,
    _UiComponent,
    _CommandMixin,
    _EventMapMixin,
    ScrollContainer,
    utility
) {

    return declare('Sage.Platform.Mobile.CalendarWidget', [_WidgetBase, _UiComponent, _CommandMixin, _EventMapMixin], {
        events: {
            'click': true
        },
        attributeMap: {
            monthContent: {node: 'monthHeader', type: 'attribute', attribute: 'innerHTML'},
            yearContent: {node: 'yearHeader', type: 'attribute', attribute: 'innerHTML'}
        },
        components: [
            {name: 'dateHeader', tag: 'div', attrs:{'class': 'date-header'}, attachEvent:'onclick:pickDate', components: [
                {name: 'monthHeader', tag: 'div', attrs: {'class': 'month'}, attachPoint: 'monthHeader'},
                {name: 'yearHeader', tag: 'div', attrs: {'class': 'year'}, attachPoint: 'yearHeader'}
            ]},
            {name: 'fix', content: '<a href="#" class="android-6059-fix">fix for android issue #6059</a>'},
            {name: 'scroller', type: ScrollContainer, props: {forceScroller: true, onPullDown: 'prevMonth', onPullUp: 'nextMonth'}, subscribeEvent: 'onContentChange:onContentChange', components: [
                {name: 'scroll', tag: 'div', components: [
                    {name: 'content', tag: 'table', attrs: {'class': 'calendar-content'}, attachPoint: 'contentNode'}
                ]}
            ]}
        ],
        baseClass: 'calendar-widget',
        contentNode: null,

        dayTemplate: new Simplate([
            "<td data-date=\"{%= $.format('YYYY-MM-DD') %}\" data-month=\"{%= $.month() %}\" data-action=\"_selectDay\">{%= $.format('D') %}</td>"
        ]),

        /**
         * @property {Number}
         * Current month number 0-11
         */
        currentMonth: null,
        /**
         * @property {Date}
         * Moment date that is the first day of the start of the calendar, since the calendar
         * has three weeks before/after the visible portion this date will never be visible
         */
        currentStartDate: null,
        /**
         * @property {Date}
         * Moment date that is the last day of the end of the calendar, since the calendar
         * has three weeks before/after the visible portion this date will never be visible
         */
        currentEndDate: null,
        /**
         * @property {HTMLElement[]}
         * Array of the `<tr>` week nodes for quicker indexing
         */
        weeks: null,
        /**
         * @property {Boolean}
         * Flag that determines if the initial base month has been rendered
         */
        _baseRendered: false,

        onStartup: function() {
            this.inherited(arguments);
            this.weeks = [];
        },
        nextMonth: function() {
            console.log('next month');
            //this.currentStartDate = this.currentEndDate.clone().add('days', 1);
            this.addMonth(this.currentStartDate, 'last');

        },
        prevMonth: function() {
            console.log('prev month');
        },

        renderBase: function() {
            this.iscroll = this.$.scroller._scroll;

            var monthStart = moment().startOf('month'),
                calStart = monthStart.clone().subtract('days', monthStart.day() + 42),
                startDate = calStart.clone();

            this.setCurrentMonth(monthStart.clone());
            this.currentStartDate = calStart.clone();

            for (var i = 0; i < 18; i++)
            {
                this.addWeek(calStart.clone());
                calStart.add('days', 7);
            }
            //this.addOffset(this.rowHeight * -3);

            this.onContentChange();

            this._baseRendered = true;
            //this.onAddBaseMonth(startDate, calStart);

        },
        /**
         * Sets the current month by removing/setting the month number on the contentNode and
         * updates the month/year text.
         * @param date Date of the first cell fully-visible on screen
         */
        setCurrentMonth: function(date) {
            var newMonth = date.month(),
                oldMonth = this.currentMonth || 0;

            domClass.replace(this.contentNode, 'month-' + newMonth, 'month-' + oldMonth);
            this.set('monthContent', date.format('MMMM'));
            this.set('yearContent', date.format('YYYY'));

            this.currentMonth = newMonth;
        },
        /**
         * Binding for ScrollContainer
         */
        onContentChange: function() {
        },
        addMonth: function(startDate, pos) {
            pos = pos || 'last';

            for (var i = 0; i < 6; i++)
            {
                this.addWeek(startDate.clone(), pos);
                startDate.add('days', 7);
            }

            //this.onContentChange();
        },
        addWeek: function(startDate, pos) {
            pos = pos || 'last';

            var days = [],
                weekNode = domConstruct.create('tr', this.contentNode, pos),
                currentDate;

            for (var i = 0; i < 7; i++)
            {
                currentDate = startDate.clone().add('days', i);

                days.push(this.dayTemplate.apply(currentDate, this));
            }
            domConstruct.place(days.join(''), weekNode);

            if (pos === 'last')
            {
                this.currentEndDate = currentDate;
                this.weeks.push(weekNode);
            }
            else
            {
                this.currentStartDate = startDate;
                this.weeks.unshift(weekNode);
            }
        },
        removeWeek: function(index, count) {
            var nodesToRemove = this.weeks.splice(index, count || 1);

            for (var i = 0; i < nodesToRemove.length; i++)
            {
                domConstruct.destroy(nodesToRemove[i]);
            }
        },


        /**
         * Fired with the start and end dates of the month
         * @template
         * @param startDate
         * @param endDate
         * @param monthNode
         */
        onAddMonth: function(startDate, endDate, monthNode) {

        },

        /**
         * Fired when a day is selected
         * @template
         * @param date
         * @param node
         */
        onSelectDay: function(date, node) {

        },

        _selectDay: function(e, node) {
            if (this.$.scroller._scroll.moved) return; // dont fire click if scrolling

            var date = domAttr.get(node, 'data-date');

            this.onSelectDay(date, node);
        },

        pickDate: function() {
            console.log('pick Date!');
        }
    });
});