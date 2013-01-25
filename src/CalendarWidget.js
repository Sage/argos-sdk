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
 * CalendarWidget
 * @alternateClassName CalendarWidget
 * @extends _UiComponent
 * @mixins _CommandMixin
 * @mixins _EventMapMixin
 * @requires ScrollContainer
 * @requires utility
 * @requires scene
 */
define('argos/CalendarWidget', [
    'dojo/_base/declare',
    'dojo/_base/connect',
    'dojo/_base/event',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-geometry',
    'dojo/dom-style',
    'dojo/query',
    'moment',
    'dijit/_WidgetBase',
    './_CommandMixin',
    './_EventMapMixin',
    './_UiComponent',
    './ScrollContainer',
    './utility',
    'argos!scene',
    'dojo/NodeList-dom'
], function (
    declare,
    connect,
    event,
    domAttr,
    domClass,
    domConstruct,
    domGeom,
    domStyle,
    query,
    moment,
    _WidgetBase,
    _UiComponent,
    _CommandMixin,
    _EventMapMixin,
    ScrollContainer,
    utility,
    scene
) {

    return declare('argos.CalendarWidget', [_WidgetBase, _UiComponent, _CommandMixin, _EventMapMixin], {
        events: {
            'click': true
        },
        attributeMap: {
            monthContent: {node: 'monthHeader', type: 'attribute', attribute: 'innerHTML'},
            yearContent: {node: 'yearHeader', type: 'attribute', attribute: 'innerHTML'},
            calendarContent: {node: 'contentNode', type: 'attribute', attribute: 'innerHTML'}
        },
        components: [
            {name: 'dateHeader', tag: 'div', attrs:{'class': 'date-header'}, components: [
                {name: 'prev', content: '<button class="button prev" data-action="prevMonth"><span>&lt;</span></button>'},
                {name: 'next', content: '<button class="button next" data-action="nextMonth"><span>&gt;</span></button>'},
                {name: 'yearHeader', tag: 'div', attrs: {'class': 'year'}, attachPoint: 'yearHeader'},
                {name: 'monthHeader', tag: 'div', attrs: {'class': 'month'}, attachPoint: 'monthHeader'}
            ]},
            {name: 'fix', content: '<a href="#" class="android-6059-fix">fix for android issue #6059</a>'},
            {name: 'scroller', type: ScrollContainer, props: {forceScroller: true}, subscribeEvent: 'onContentChange:onContentChange', components: [
                {name: 'scroll', tag: 'div', components: [
                    {name: 'content', tag: 'table', attrs: {'class': 'calendar-content'}, attachPoint: 'contentNode'}
                ]}
            ]}
        ],
        baseClass: 'calendar-widget',
        contentNode: null,

        dayTemplate: new Simplate([
            "<td class=\"{%: $.cls %}\" data-date=\"{%= $.date.format('YYYY-MM-DD') %}\" data-month=\"{%= $.date.month() %}\" data-action=\"_selectDay\">{%= $.date.format('D') %}</td>"
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
         * @property {Boolean}
         * Flag that determines if the initial base month has been rendered
         */
        _baseRendered: false,
        selectedNode: null,
        selectedDate: null,

        onStartup: function() {
            this.inherited(arguments);
        },
        nextMonth: function(e) {
            this.clear();

            var nextMonthDate = (this.currentEndDate.month() === this.currentMonth)
                ? this.currentEndDate.add('months', 1)
                : this.currentEndDate;

            this.addMonth(nextMonthDate);
            event.stop(e);
        },
        prevMonth: function(e) {
            this.clear();

            var prevMonthDate = (this.currentStartDate.month() === this.currentMonth)
                ? this.currentStartDate.subtract('months', 1)
                : this.currentStartDate;

            this.addMonth(prevMonthDate);
            event.stop(e);
        },

        renderBase: function() {
            this.addMonth(moment());
            this.selectDate(moment());

            this._baseRendered = true;
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

            var monthStart = startDate.startOf('month'),
                calStart = monthStart.clone().subtract('days', monthStart.day()),
                weeks = query.NodeList(),
                currentDate = calStart.clone();

            for (var w = 0; w < 6; w++)
            {

                var days = [],
                    weekNode = domConstruct.create('tr');

                for (var d = 0; d < 7; d++)
                {
                    var context = {
                        date: currentDate,
                        cls: this.detectDayClass(currentDate.clone())
                    };

                    days.push(this.dayTemplate.apply(context, this));
                    currentDate.add('days', 1);
                }
                domConstruct.place(days.join(''), weekNode);
                weeks.push(weekNode);
            }
            weeks.place(this.contentNode, pos);

            this.setDate(calStart, currentDate);
            this.setCurrentMonth(monthStart);

            this.onAddMonth(this.currentStartDate.clone(), this.currentEndDate.clone());

            this.onContentChange();
        },
        detectDayClass: function(date) {
            var cls = [],
                dayOfWeek = date.day();

            if (dayOfWeek === 0 || dayOfWeek === 6)
                cls.push('is-weekend');

            if (date.diff(moment().startOf('day'), 'days') === 0)
                cls.push('is-today');

            return cls.join(' ');
        },
        clear: function() {
            this.set('calendarContent', '');
        },
        setDate: function(startDate, endDate) {
            this.currentEndDate = endDate.clone();
            this.currentStartDate = startDate.clone();
        },
        selectDate: function(date) {
            if (date.month() !== this.currentMonth)
            {
                this.clear();
                this.addMonth(date);
            }
            var node = query(dojo.string.substitute('td[data-date=${0}]', [date.format('YYYY-MM-DD')]), this.contentNode)[0];
            this._selectDay(null, node);
        },

        /**
         * Fired with the start and end dates of the month
         * @template
         * @param startDate
         * @param endDate
         */
        onAddMonth: function(startDate, endDate) {

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
            if (this.$.scroller._scroll && this.$.scroller._scroll.moved) return; // dont fire click if scrolling

            if (this.selectedNode)
                domClass.remove(this.selectedNode, 'is-selected');

            domClass.add(node, 'is-selected');

            this.selectedNode = node;

            var date = moment(domAttr.get(node, 'data-date'), 'YYYY-MM-DD');

            this.selectedDate = date;
            this.onSelectDay(date, node);
        },

        pickDate: function() {
            var options = {
                date: this.selectedDate.toDate(),
                showTimePicker: false,
                timeless: false,
                tools: {
                    top: [{
                        id: 'complete',
                        fn: this.selectDateSuccess,
                        scope: this
                    },{
                        id: 'cancel',
                        place: 'left',
                        fn: scene().back(),
                        scope: this
                    }]
                    }
                };

            scene().showView('datetimepicker', options);
        },
        selectDateSuccess: function() {
            var view = scene().getView('datetimepicker');

            this.selectDate(moment(view.getDateTime()).sod());

            scene().back();
        }
    });
});