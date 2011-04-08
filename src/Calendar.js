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
    var pad = function(n) { return n < 10 ? '0' + n : n };

    Sage.Platform.Mobile.Calendar = Ext.extend(Sage.Platform.Mobile.View, {
        attachmentPoints: {
            contentEl: '.panel-content',
            calendarEl: '.calendar-content',
            timeEl: '.time-content',
            hourField: '.hour-field',
            minuteField: '.minute-field',
            meridiemField: '.meridiem-field',
            validationContentEl: '.panel-validation-summary > ul'
        },
        validationSummaryTemplate: new Simplate([
            '<div class="panel-validation-summary">',
            '<h2>{%: $.validationSummaryText %}</h2>',
            '<ul>',
            '</ul>',
            '</div>'
        ]),
        validationSummaryItemTemplate: new Simplate([
            '<li>',
            '<a href="#TT">',
            '<h3>{%: $.message %}</h3>',
            '<h4>&nbsp;</h4>',
            '</a>',
            '</li>'
        ]),
        viewTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '{%! $.validationSummaryTemplate %}',
                '<div class="panel-content">',
                    '<div class="calendar-content"></div>',
                    '<div class="time-content">',
                        '<input type="number" min="1" max="12" class="hour-field" />',
                        '&nbsp;:&nbsp;',
                        '<input type="number" min="0" max="59" class="minute-field" />',
                        '<div class="date-tt">',
                            '<div class="toggle meridiem-field" data-action="toggleMeridiem">',
                                '<span class="thumb"></span>',
                                '<span class="toggleOn">{%= $.amText %}</span>',
                                '<span class="toggleOff">{%= $.pmText %}</span>',
                            '</div>',
                        '</div>',
                    '</div>',
                '</div>',
            '</div>'
        ]),
        validationSummaryText: 'Validation Summary',
        calendarStartTemplate: '<table class="calendar-table">',
        calendarMonthHeaderTemplate: new Simplate([
            '<tr class="calendar-month-header">',
            '<th class="calendar-prev-month"><button class="button" data-action="goToPreviousMonth"><span></span></button></th>',
            '<th class="calendar-month-name" colspan="5">{%= $.monthName %} &nbsp; {%=$.year %}</th>',
            '<th class="calendar-next-month"><button class="button" data-action="goToNextMonth"><span></span></button></th>',
            '</tr>'
        ]),
        titleText: 'Calendar',
        amText: 'AM',
        pmText: 'PM',
        calendarWeekHeaderStartTemplate: '<tr class="calendar-week-header">',
        calendarWeekHeaderTemplate: '<td class="calendar-weekday">{0}</td>',
        calendarWeekHeaderEndTemplate: '</tr>',
        calendarWeekStartTemplate: '<tr class="calendar-week">',
        calendarEmptyDayTemplate: '<td>&nbsp;</td>',
        calendarDayTemplate: '<td class="calendar-day {1}" data-action="selectDay" data-date="{2}">{0}</td>',
        calendarWeekEndTemplate: '</tr>',
        calendarEndTemplate: '</table>',
        invalidHourError: 'Invalid hour format',
        invalidMinuteError: 'Invalid minute format',
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
            
            this.timeEl.setVisibilityMode(Ext.Element.DISPLAY);

            this.hourField
                .on('blur', this.validateHour, this);

            this.minuteField                
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
            {
                field.removeClass('field-error');
                field.dom.value = pad(value);
            }

            if (!this.isValid())
                this.showValidationSummary();
            else
                this.hideValidationSummary();
        },
        showValidationSummary: function() {
            var content = [];

            if (this.hourField.hasClass('field-error'))
                content.push(this.validationSummaryItemTemplate.apply({
                    'message': this.invalidHourError
                }));
            if (this.minuteField.hasClass('field-error'))
                content.push(this.validationSummaryItemTemplate.apply({
                    'message': this.invalidMinuteError
                }));

            this.validationContentEl.update(content.join(''));
            this.el.addClass('panel-form-error');
        },
        hideValidationSummary: function() {
            this.hourField.removeClass('field-error');
            this.minuteField.removeClass('field-error');
            
            this.el.removeClass('panel-form-error');
            this.validationContentEl.update('');
        },
        isValid: function() {
            return !(this.hourField.hasClass('field-error') || this.minuteField.hasClass('field-error'));
        },
        toggleMeridiem: function(params) {
            var el = params.$source,
                toggledValue = el && (el.getAttribute('toggled') !== 'true');

            if (el) el.dom.setAttribute('toggled', toggledValue);
        },
        show: function(options) {
            Sage.Platform.Mobile.Calendar.superclass.show.call(this, options);

            this.showTimePicker = this.options && this.options.showTimePicker;

            this.date = (this.options && this.options.date) || new Date();
            this.year = this.date.getFullYear();
            this.month = this.date.getMonth();

            this.hourField.dom.value = "" + pad(this.date.getHours() > 12 ? this.date.getHours() - 12 : (this.date.getHours() || 12));
            this.minuteField.dom.value = "" + pad(this.date.getMinutes());
            this.meridiemField.dom.setAttribute('toggled', this.date.getHours() < 12);

            this.hideValidationSummary();

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
            var result = new Date(this.date.getTime()),
                isPM = this.meridiemField.getAttribute('toggled') !== 'true',
                hours = parseInt(this.hourField.getValue(), 10),
                minutes = parseInt(this.minuteField.getValue(), 10);

            hours = isPM
                ? (hours % 12) + 12
                : (hours % 12);

            result.setHours(hours);
            result.setMinutes(minutes);

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
                isCurrentMonth =  this.year === Date.today().getFullYear() && this.month === Date.today().getMonth();

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
