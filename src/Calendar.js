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

(function() {
    Sage.Platform.Mobile.Calendar = Ext.extend(Sage.Platform.Mobile.View, {
        attachmentPoints: {
            contentEl: '.panel-content',
            calendarEl: '.calendar-content',
            timeEl: '.time-content',
            hourField: '.hour-field',
            minuteField: '.minute-field'
        },
        viewTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel">',
                '<div class="panel-content">',
                    '<div class="calendar-content"></div>',
                    '<div class="time-content">',
                        '<input type="number" maxlength="2" min="0" max="23" class="hour-field" />',
                        '&nbsp;:&nbsp;',
                        '<input type="number" maxlength="2" min="0" max="59" class="minute-field" />',
                    '</div>',
                '</div>',
            '</div>'
        ]),
        calendarStartTemplate: '<table class="calendar-table">',
        calendarMonthHeaderTemplate: new Simplate([
            '<tr class="calendar-month-header">',
            '<th class="calendar-prev-month"><a href="#" data-action="goToPreviousMonth"><span>&lt;&lt;</span></a></th>',
            '<th class="calendar-month-name" colspan="5">{%= $.monthName %} &nbsp; {%=$.year %}</th>',
            '<th class="calendar-next-month"><a href="#" data-action="goToNextMonth"><span>&gt;&gt;</span></a></th>',
            '</tr>'
        ]),
        titleText: 'Calendar',
        calendarWeekHeaderStartTemplate: '<tr class="calendar-week-header">',
        calendarWeekHeaderTemplate: '<td class="calendar-weekday">{0}</td>',
        calendarWeekHeaderEndTemplate: '</tr>',
        calendarWeekStartTemplate: '<tr class="calendar-week">',
        calendarEmptyDayTemplate: '<td>&nbsp;</td>',
        calendarDayTemplate: '<td class="calendar-day {1}" data-action="selectDay" data-date="{2}">{0}</td>',
        calendarWeekEndTemplate: '</tr>',
        calendarEndTemplate: '</table>',
        id: 'generic_calendar',
        expose: false,
        date: false,
        showTimePicker: false,
        selectedDateEl: false,
        weekEnds: [0, 6],
        dayLabels : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        monthLabels : ['January', 'February', 'March', 'April',
                     'May', 'June', 'July', 'August', 'September',
                     'October', 'November', 'December'],
        daysInMonth : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        init: function() {
            Sage.Platform.Mobile.Calendar.superclass.init.call(this);

            this.el.on('swipe', this.onSwipe, this);

            this.hourField
                .on('keyup', this.validateHour, this)
                .on('blur', this.validateHour, this);

            this.minuteField
                .on('keyup', this.validateMinute, this)
                .on('blur', this.validateMinute, this);
        },
        onSwipe: function(evt, el, o) {            
            switch (evt.browserEvent.direction) {
                case 'right':
                    this.goToPreviousMonth();
                    break;
                case 'left':
                    this.goToNextMonth();
                    break;
            }
        },
        validateHour: function(evt, el, o) {
            var minimum = parseInt(this.hourField.getAttribute('min'), 10),
                maximum = parseInt(this.hourField.getAttribute('max'), 10);

            this.validate(this.hourField, minimum, maximum);
        },
        validateMinute: function(evt, el, o) {
            var minimum = parseInt(this.minuteField.getAttribute('min'), 10),
                maximum = parseInt(this.minuteField.getAttribute('max'), 10);

            this.validate(this.minuteField, minimum, maximum);
        },
        validate: function(field, minimum, maximum) {
            var value = parseInt(field.getValue(), 10);

            if (isNaN(value) || value < minimum || value > maximum)
                field.addClass('field-error');
            else
                field.removeClass('field-error');
        },
        show: function(options) {
            Sage.Platform.Mobile.Calendar.superclass.show.call(this, options);

            this.showTimePicker = this.options && this.options.showTimePicker;

            this.date = (this.options && this.options.date) || new Date();
            this.year = this.date.getFullYear();
            this.month = this.date.getMonth();

            this.hourField.dom.value = this.date.getHours();
            this.minuteField.dom.value = this.date.getMinutes();
            
            this.renderCalendar();

            if (this.showTimePicker)
                this.timeEl.show();
            else
                this.timeEl.hide();
        },
        goToNextMonth: function() {
            if (this.month == 11)
            {
                this.year += 1;
            }
            this.month = (this.month + 1) % 12;

            this.renderCalendar();
        },
        goToPreviousMonth: function() {
            if (this.month == 0)
            {
                this.year -= 1;
                this.month = 11;
            }
            else
            {
                this.month = (this.month - 1) % 12;
            }

            this.renderCalendar();
        },
        selectDay: function(options, evt, el) {
            if (this.selectedDateEl) this.selectedDateEl.removeClass('selected');
            this.selectedDateEl = Ext.get(el).addClass('selected');

            this.date = new Date(this.year, this.month, options.date);
        },
        getDateTime: function() {
            var result = new Date(this.date.getTime());

            result.setHours(this.hourField.getValue());
            result.setMinutes(this.minuteField.getValue());

            return result;
        },
        renderCalendar: function() {
            var mm = this.month,
                yyyy = this.year,
                firstDay = new Date(yyyy, mm, 1),
                startingDay = firstDay.getDay(),
                monthLength = this.daysInMonth[mm],
                today = new Date(),
                day = 1, calHTML = [], dayClass = '', selectedClass = '',
                weekendClass = '', i = 0, j = 0, selectedEl = false,
                isCurrentMonth = this.date.between((new Date(yyyy, mm, 1)), (new Date(yyyy, mm, monthLength)));

            this.monthName = this.monthLabels[this.month];
            
            // compensate for leap year
            if (this.month == 1 && Date.isLeapYear(yyyy)) // February only!
            {
                monthLength = 29;
            }

            calHTML.push(this.calendarStartTemplate);
            // Month Header
            calHTML.push(this.calendarMonthHeaderTemplate.apply(this));

            // Week Header
            calHTML.push(this.calendarWeekHeaderStartTemplate);
            for(i = 0; i <= 6; i++ ){
                calHTML.push(String.format(this.calendarWeekHeaderTemplate, this.dayLabels[i]));
            }
            calHTML.push(this.calendarWeekHeaderEndTemplate);

            //Weeks
            for (i = 0; i <= 6; i++)
            {
                calHTML.push(this.calendarWeekStartTemplate);
                //Days
                for (j = 0; j <= 6; j++)
                {
                    if (day <= monthLength && (i > 0 || j >= startingDay))
                    {
                        //Check for today
                        dayClass = (isCurrentMonth == true && day == today.getDate()) ? 'today' : '';

                        //Check for weekends
                        weekendClass = (this.weekEnds.indexOf(j) !== -1) ? ' weekend' : '';

                        //Check for selected date
                        if (day == this.date.getDate() && mm == this.date.getMonth() && yyyy == this.date.getFullYear())
                        {
                            selectedClass = ' selected';
                        }
                        else
                        {
                            selectedClass = '';
                        }
                        weekendClass = (this.weekEnds.indexOf(j) !== -1) ? ' weekend' : '';

                        calHTML.push(String.format( this.calendarDayTemplate,
                                                    day,
                                                    (dayClass + weekendClass + selectedClass),
                                                    day
                                                   )
                                    );
                        day++;
                    }
                    else
                    {
                        calHTML.push(this.calendarEmptyDayTemplate);
                    }
                    
                }
                calHTML.push(this.calendarWeekEndTemplate);
                // stop making rows if we've run out of days
                if (day > monthLength) break;
            }
            calHTML.push(this.calendarEndTemplate);

            this.calendarEl.update(calHTML.join(''));

            selectedEl = Ext.DomQuery.select('.selected', 'table.calendar-table', 'td');
            if (Ext.isArray(selectedEl) && selectedEl.length > 0) this.selectedDateEl = Ext.get(selectedEl[0]);
            else this.selectedDateEl = false;
        }
    });
})();