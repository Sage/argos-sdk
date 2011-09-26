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

define('Sage/Platform/Mobile/Calendar', ['Sage/Platform/Mobile/View'], function() {
    var pad = function(n) { return n < 10 ? '0' + n : n };
    dojo.declare('Sage.Platform.Mobile.Calendar', [Sage.Platform.Mobile.View], {
        // Localization
        titleText: 'Calendar',
        amText: 'AM',
        pmText: 'PM',
        validationSummaryText: 'Validation Summary',
        invalidHourErrorText: 'Invalid hour format',
        invalidMinuteErrorText: 'Invalid minute format',


        validationSummaryTemplate: new Simplate([
            '<div class="panel-validation-summary">',
            '<h2>{%: $.validationSummaryText %}</h2>',
            '<ul data-dojo-attach-point="validationNode">',
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
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '{%! $.validationSummaryTemplate %}',
                '<div data-dojo-attach-point="contentNode" class="panel-content">',
                    '<div data-dojo-attach-point="calendarNode" class="calendar-content"></div>',
                    '<div data-dojo-attach-point="timeNode" class="time-content">',
                        '<input data-dojo-attach-point="hourNode" type="number" min="1" max="12" class="hour-field" />',
                        '&nbsp;:&nbsp;',
                        '<input data-dojo-attach-point="minuteNode" type="number" min="0" max="59" class="minute-field" />',
                        '<div class="date-tt">',
                            '<div data-dojo-attach-point="meridiemNode" class="toggle meridiem-field" data-action="toggleMeridiem">',
                                '<span class="thumb"></span>',
                                '<span class="toggleOn">{%= $.amText %}</span>',
                                '<span class="toggleOff">{%= $.pmText %}</span>',
                            '</div>',
                        '</div>',
                    '</div>',
                '</div>',
            '</div>'
        ]),
        calendarStartTemplate: '<table class="calendar-table">',
        calendarMonthHeaderTemplate: new Simplate([
            '<tr class="calendar-month-header">',
            '<th class="calendar-prev-month"><button class="button" data-action="goToPreviousMonth"><span></span></button></th>',
            '<th class="calendar-month-name" colspan="5">{%= $.monthName %} &nbsp; {%=$.year %}</th>',
            '<th class="calendar-next-month"><button class="button" data-action="goToNextMonth"><span></span></button></th>',
            '</tr>'
        ]),
        calendarWeekHeaderStartTemplate: '<tr class="calendar-week-header">',
        calendarWeekHeaderTemplate: '<td class="calendar-weekday">${0}</td>',
        calendarWeekHeaderEndTemplate: '</tr>',
        calendarWeekStartTemplate: '<tr class="calendar-week">',
        calendarEmptyDayTemplate: '<td>&nbsp;</td>',
        calendarDayTemplate: '<td class="calendar-day ${1}" data-action="selectDay" data-date="${2}">${0}</td>',
        calendarWeekEndTemplate: '</tr>',
        calendarEndTemplate: '</table>',
        attributeMap: {
            validationContent: {
                node: 'validationNode',
                type: 'innerHTML'
            },
            calendarContent: {
                node: 'calendarNode',
                type: 'innerHTML'
            }
        },


        id: 'generic_calendar',
        expose: false,
        date: false,
        showTimePicker: false,
        selectedDateEl: false,
        weekEnds: [0, 6],
        init: function() {
            this.inherited(arguments);

            dojo.connect(this.hourNode, 'onblur', this, this.validateHour);
            dojo.connect(this.minuteNode, 'onblur', this, this.validateMinute);
        },
        validateHour: function(evt, el, o) {
            var minimum = parseInt(dojo.attr(this.hourField, 'min'), 10),
                maximum = parseInt(dojo.attr(this.hourField, 'max'), 10);
            this.validate(this.hourNode, minimum, maximum);
        },
        validateMinute: function(evt, el, o) {
            var minimum = parseInt(dojo.attr(this.minuteField, 'min'), 10),
                maximum = parseInt(dojo.attr(this.minuteField, 'max'), 10);

            this.validate(this.minuteField, minimum, maximum);
        },
        validate: function(field, minimum, maximum) {
            var value = parseInt(field.value, 10);

            if (isNaN(value) || value < minimum || value > maximum) {
                dojo.addClass(field, 'field-error');
            } else {
                dojo.removeClass(field, 'field-error');
                field.value = pad(value);
            }

            if (!this.isValid())
                this.showValidationSummary();
            else
                this.hideValidationSummary();
        },
        showValidationSummary: function() {
            var content = [];

            if (dojo.hasClass(this.hourNode, 'field-error'))
                content.push(this.validationSummaryItemTemplate.apply({
                    'message': this.invalidHourErrorText
                }));
            if (dojo.hasClass(this.minuteNode, 'field-error'))
                content.push(this.validationSummaryItemTemplate.apply({
                    'message': this.invalidMinuteErrorText
                }));

            this.set('validationContent', content.join(''));
            dojo.addClass(this.contentNode, 'panel-form-error');
        },
        hideValidationSummary: function() {
            dojo.removeClass(this.hourNode, 'field-error');
            dojo.removeClass(this.minuteNode, 'field-error');

            dojo.removeClass(this.contentNode, 'panel-form-error');
            this.set('validationContent', '');
         },
        isValid: function() {
            return !(dojo.hasClass(this.hourNode, 'field-error') || dojo.hasClass(this.minuteNode, 'field-error'));
        },
        toggleMeridiem: function(params) {
            var el = params.$source,
                toggledValue = el && (dojo.attr(el, 'toggled') !== 'true');

            if (el) dojo.attr(el, 'toggled', toggledValue);
        },
        show: function(options) {
            this.inherited(arguments);

            this.showTimePicker = this.options && this.options.showTimePicker;

            this.date = (this.options && this.options.date) || new Date();
            this.year = this.date.getFullYear();
            this.month = this.date.getMonth();

            this.hourNode.value = "" + pad(this.date.getHours() > 12 ? this.date.getHours() - 12 : (this.date.getHours() || 12));
            this.minuteNode.value = "" + pad(this.date.getMinutes());
            dojo.attr(this.meridiemNode, 'toggled', this.date.getHours() < 12);

            this.hideValidationSummary();

            this.renderCalendar();

            if (this.showTimePicker)
                dojo.style(this.timeNode, 'display', 'block');
            else
                dojo.style(this.timeNode, 'display', 'none');

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
            if (this.selectedDateNode) dojo.removeClass(this.selectedDateNode, 'selected');
            this.selectedDateNode = el;
            dojo.addClass(el, 'selected');
            this.date = new Date(this.year, this.month, options.date);
        },
        selectToday: function(){
            var today = dojo.query('.today')[0];
            if(today) this.selectDay({date: new Date().getDate()}, null, today);
        },
        getDateTime: function() {
            var result = new Date(this.date.getTime()),
                isPM = dojo.attr(this.meridiemNode, 'toggled') !== 'true',
                hours = parseInt(this.hourNode.value, 10),
                minutes = parseInt(this.minuteNode.value, 10);

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
                monthLength = firstDay.getDaysInMonth(),
                today = new Date(),
                day = 1, calHTML = [], dayClass = '', selectedClass = '',
                weekendClass = '', i = 0, j = 0, selectedNode = false,
                isCurrentMonth =  this.year === Date.today().getFullYear() && this.month === Date.today().getMonth();

            this.monthName = Date.CultureInfo.monthNames[mm];

            calHTML.push(this.calendarStartTemplate);
            // Month Header
            calHTML.push(this.calendarMonthHeaderTemplate.apply(this));

            // Week Header
            calHTML.push(this.calendarWeekHeaderStartTemplate);
            for(i = 0; i <= 6; i++ ){
                calHTML.push(dojo.string.substitute(this.calendarWeekHeaderTemplate, [Date.CultureInfo.abbreviatedDayNames[i]]));
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
                        dayClass = (isCurrentMonth === true && day == today.getDate()) ? 'today' : '';

                        //Check for weekends
                        weekendClass = (this.weekEnds.indexOf(j) !== -1) ? ' weekend' : '';

                        //Check for selected
                        selectedClass = (this.date.getFullYear() === yyyy &&
                                        this.date.getMonth() === mm &&
                                        this.date.getDate() === day)
                                            ? ' selected'
                                            : '';

                        calHTML.push(dojo.string.substitute( this.calendarDayTemplate,
                                                    [day,
                                                    (dayClass + weekendClass + selectedClass),
                                                    day]
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

            this.set('calendarContent', calHTML.join(''));
            this.selectedDateNode = dojo.query('.selected')[0];
        }
    });
});
