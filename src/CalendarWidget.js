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
    var scrollStart = function() { return this.onScrollStart.bindDelegate(this); },
        scrollMove = function() { return this.onScrollMove.bindDelegate(this); },
        scrollEnd = function() { return this.onScrollEnd.bindDelegate(this); };

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
            {name: 'scroller', type: ScrollContainer, props: {useTransition: false, forceScroller: true, onStart: scrollStart, onMove: scrollMove, onEnd: scrollEnd}, subscribeEvent: 'onContentChange:onContentChange', components: [
                {name: 'scroll', tag: 'div', components: [
                    {name: 'content', tag: 'table', attrs: {'class': 'calendar-content'}, attachPoint: 'contentNode'}
                ]}
            ]}
        ],
        baseClass: 'calendar-widget',
        contentNode: null,

        weekTemplate: new Simplate([
            "<tr data-week=\"{%= $.format('w') %}\" style=\"height:{%= $$.rowHeight %}px\"></tr>"
        ]),
        dayTemplate: new Simplate([
            "<td data-date=\"{%= $.format('YYYY-MM-DD') %}\" data-month=\"{%= $.month() %}\" data-action=\"_selectDay\">{%= $.format('D') %}</td>"
        ]),
        /**
         * @property {Number}
         * Height of rows, auto-set by detecting height of scroll-container
         */
        rowHeight: 75,

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
        _track: 0,
        _prevScroll: null,
        _currentTopOffset: 0,

        onStartup: function() {
            this.inherited(arguments);
            this.weeks = [];
        },

        renderBase: function() {
            this.iscroll = this.$.scroller._scroll;

            var monthStart = moment().startOf('month'),
                calStart = monthStart.clone().subtract('days', monthStart.day() + 21),
                startDate = calStart.clone();

            this.setCurrentMonth(monthStart.clone());
            this.currentStartDate = calStart.clone();

            this.setRowHeight(this.detectRowHeight());

            for (var i = 0; i < 12; i++)
            {
                this.addWeek(calStart.clone());
                calStart.add('days', 7);
            }
            this.addOffset(this.rowHeight * -3);

            this.onContentChange();

            this._baseRendered = true;
            this.onAddBaseMonth(startDate, calStart);

            this.iscroll.maxScrollY = -999999;
           // this.iscroll._pos(0, this.rowHeight * -3);
        },
        /**
         * Detects the current visible month by taking the day of month value of the first
         * visible cell (21 days after the first cell) and checking if its near the end of the month.
         */
        detectCurrentMonth: function() {
            var visibleDate = this.currentStartDate.clone().add('days', 21),
                offset = visibleDate.date();

            if (offset >= 18)
                this.setCurrentMonth(visibleDate.clone().add('months', 1));
            else if (offset <= 8)
                this.setCurrentMonth(visibleDate.clone());
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
        /**
         * Handler for the scroll-move event from iscroll.
         */
        onScrollMove: function() {
            // scroll distance starts at 0, goes downwards (i.e. 0 to -800 for a 800px container)
            var prevTrack = this._prevScroll || this.iscroll.y;

            var newTrack = this.iscroll.y - prevTrack;

            this._track += newTrack;

            var numRows = this._track / this.rowHeight;
            numRows = numRows > 0 ? Math.floor(numRows) : Math.ceil(numRows);

            var addToTop = numRows > 0;

console.log(this.iscroll);
            this._prevScroll = this.iscroll.y;
            if (numRows === 0) return;

            console.log('subtracting...', numRows * this.rowHeight);
            this._track -= numRows * this.rowHeight;

            for (var i = 0; i < Math.abs(numRows); i++)
            {
                if (addToTop)
                {
                    //this.removeWeek(this.weeks.length - 1); // distY is positive
                    // add week to beginning handles setting the new start date
                    //this.currentStartDate.subtract('days', 7);
                    this.currentEndDate.subtract('days', 7); // we removed the last week, so end is now 7 days earlier
                    this.addWeek(this.currentStartDate.clone().subtract('days', 7), 'first'); // distY is positive
                    //this.swapWeek(this.currentStartDate.clone(), 'top');
                }
                else
                {
                    //this.removeWeek(0); // distY is negative
                    this.currentStartDate.add('days', 7); // we removed the first week, so start is now 7 days later
                    //this.currentEndDate.add('days', 7);
                    this.addWeek(this.currentEndDate.clone().add('days', 1), 'last'); //distY is negative
                    //this.swapWeek(this.currentEndDate.clone().add('days', 1), 'bottom');
                    //this.iscroll._pos(0, this.iscroll.y + this.rowHeight); // iscroll doesnt adjust scroller on content, manually do it
                }
            }

            domStyle.set(this.iscroll.wrapper, 'height', (this.rowHeight * this.weeks.length) + 'px');
            //this.onContentChange();
            this.detectCurrentMonth();
        },
        onScrollStart: function() {
            //console.log('START:', arguments);
        },
        onScrollEnd: function() {
            console.log('END:', arguments);
        },
        swapWeek: function(newDate, direction) {
            if (direction === 'top')
            {
                var weekNode = this.weeks.splice(this.weeks.length -1, 1)[0];
                domConstruct.place(weekNode, this.contentNode, 'first');
                this.weeks.unshift(weekNode);
                this.alterWeekData(weekNode, newDate);
            }
            else
            {
                var weekNode = this.weeks.splice(0, 1)[0];
                console.log(weekNode, this.contentNode);
                domConstruct.place(weekNode, this.contentNode, 'last');
                this.weeks.push(weekNode);
                this.alterWeekData(weekNode, newDate);
            }
        },
        alterWeekData: function(node, date) {
            var children = node.children;
            domAttr.set(node, 'data-week', date.format('w'));

            for (var i = 0; i < children.length; i++)
            {
                var td = children[i],
                    tdDate = date.format('YYYY-MM-DD'),
                    tdMonth = date.month(),
                    tdDay = date.date();
                domAttr.set(td, {
                    'data-date': tdDate,
                    'data-month': tdMonth,
                    'innerHTML': tdDay
                });
                date.add('days', 1);
            }
        },
        detectRowHeight: function() {
            var containerHeight = domGeom.position(this.$.scroller.domNode).h;
            return Math.floor(containerHeight / 6);
        },
        setRowHeight: function(height) {
            this.rowHeight = height;
        },
        addWeek: function(startDate, pos) {
            pos = pos || 'last';

            var days = [],
                weekNode = domConstruct.place(this.weekTemplate.apply(startDate, this), this.contentNode, pos),
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
                this.addOffset(-this.rowHeight);
                this.currentStartDate = startDate;
                this.weeks.unshift(weekNode);
            }

            if (this._baseRendered)
                this.onAddWeek(startDate, weekNode);
        },
        removeWeek: function(index, count) {
            var nodesToRemove = this.weeks.splice(index, count || 1);

            for (var i = 0; i < nodesToRemove.length; i++)
            {
                domConstruct.destroy(nodesToRemove[i]);
            }
        },
        addOffset: function(offset) {
            this._currentTopOffset = domStyle.get(this.contentNode, 'top') + offset;
            domStyle.set(this.contentNode, 'top', this._currentTopOffset + 'px');
        },


        /**
         * Fired after the base month is added
         * @template
         * @param startDate
         * @param endDate
         */
        onAddBaseMonth: function(startDate, endDate) {

        },
        /**
         * Fired with the start date of the week added
         * @template
         * @param startDate
         */
        onAddWeek: function(startDate, weekNode) {

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