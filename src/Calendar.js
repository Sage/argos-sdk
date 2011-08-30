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
            dayField: '#day-field',
            monthField: '#month-field',
            yearField: '#year-field',
            hourField: '#hour-field',
            minuteField: '#minute-field',
            meridiemField: '.meridiem-field',
            decrementing: '.decrement',
        },
        viewTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '<div class="panel-content" id="datetime-picker">',
                    '<div class="calendar-content">',
                    '<table id="datetime-picker-date">',
                        '<caption>Date</caption>',
                        '<tr>',
                            '<td><button class="day"   data-action="increment">+</button></td>',
                            '<td><button class="month" data-action="increment">+</button></td>',
                            '<td><button class="year"  data-action="increment">+</button></td>',
                        '</tr>',
                        '<tr>',
                            '<td><input type="number" id="day-field" min="1" max="31" /></td>',
                            '<td>',
								'<select id="month-field">',
									'<option value="0">Jan</option>',
									'<option value="1">Feb</option>',
									'<option value="2">Mar</option>',
									'<option value="3">Apr</option>',
									'<option value="4">May</option>',
									'<option value="5">Jun</option>',
									'<option value="6">Jul</option>',
									'<option value="7">Aug</option>',
									'<option value="8">Sep</option>',
									'<option value="9">Oct</option>',
									'<option value="10">Nov</option>',
									'<option value="11">Dec</option>',
                                '</select>',
							'</td>',
                            '<td><input class="year" type="number" id="year-field" min="2010" max="2020" /></td>',
                        '</tr>',
                        '<tr>',
                            '<td><button class="day"   data-action="decrement">-</button></td>',
                            '<td><button class="month" data-action="decrement">-</button></td>',
                            '<td><button class="year"  data-action="decrement">-</button></td>',
                        '</tr>',
                        '<tr id="datetime-picker-today-button">',
                            '<td colspan="3"><button onclick="return init(this.form.id);">Today</button></td>',
                        '</tr>',
                    '</table>',
                    '</div>',
                    '<div class="time-content">',
                        '<table id="datetime-picker-time">',
                            '<caption>Time</caption>',
                            '<tr>',
                                '<td><button class="hour" data-action="increment">+</button></td>',
                                '<td><button class="minute" data-action="increment">+</button></td>',
                            '</tr>',
                            '<tr>',
                                '<td><input type="number" id="hour-field" min="1" max="12" /></td>',
                                '<td><input type="number" id="minute-field" min="0" max="59" step="15" /></td>',
                                '<td>',
                                    '<div class="date-tt">',
                                        '<div class="toggle meridiem-field" data-action="toggleMeridiem">',
                                            '<span class="thumb"></span>',
                                            '<span class="toggleOn">{%= $.amText %}</span>',
                                            '<span class="toggleOff">{%= $.pmText %}</span>',
                                        '</div>',
                                    '</div>',
                                '</td>',
                            '</tr>',
                            '<tr>',
                                '<td><button class="hour" data-action="decrement">-</button></td>',
                                '<td><button class="minute" data-action="decrement">-</button></td>',
                            '</tr>',
                        '</table>',
                    '</div>',
                '</div>',
            '</div>'
        ]),
        titleText: 'Calendar',
        amText: (Date.CultureInfo ? Date.CultureInfo.amDesignator : 'AM'),
        pmText: (Date.CultureInfo ? Date.CultureInfo.pmDesignator : 'PM'),
        months: (Date.CultureInfo ? Date.CultureInfo.abbreviatedMonthNames : ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']),
        dateFormat: (Date.CultureInfo ? Date.CultureInfo.formatPatterns.shortDate : 'mm/dd/YYYY'),
        id: 'generic_calendar',
        expose: false,
        date: false,
        showTimePicker: false,
        selectedDateEl: false,
        weekEnds: [0, 6],
        daysInMonth: function() {
            var dlo = (1==this.month) ? 28 : 30;
            var dhi = (1==this.month) ? 29 : 31;
            return (new Date(this.year, this.month, dlo).getMonth() == new Date(this.year, this.month, dhi).getMonth())
                ? dhi
                : dlo
                ;
        },
        init: function() {
            Sage.Platform.Mobile.Calendar.superclass.init.call(this);

            this.el.on('swipe', this.onSwipe, this);
            this.timeEl.setVisibilityMode(Ext.Element.DISPLAY);

            this.dayField
                .on('blur', this.validate, this);
            this.monthField
                .on('change', this.validate, this);
            this.yearField
                .on('blur', this.validate, this);
            this.hourField
                .on('blur', this.validate, this);
            this.minuteField                
                .on('blur', this.validate, this);
        },
        onSwipe: function(evt, el, o) {            
            switch (evt.browserEvent.direction) {
                case 'right':
                    this.decrement('month');
                    break;
                case 'left':
                    this.increment('month');
                    break;
            }
        },
        validate: function(event, field) {
            var fields = ['year','month','day'];
            var el = field.id || field.dom.id;
            if (el.match('year')) {
                this.year = this.yearField.dom.value;
            }
            if (el.match('month')) {
                this.month = this.monthField.dom.value;
                this.dayField.dom.max = this.daysInMonth();
            }
            this.date = new Date(this.year, this.month, this.dayField.dom.value);

            for (i in fields) {
                var el = this[ fields[i] + 'Field'];
                if(el) {
                    if ('day' == fields[i]) { el.dom.max = this.daysInMonth(); }
                    if (el.dom.min && parseInt(el.dom.value) < el.dom.min) { el.dom.value = el.dom.min; }
                    if (el.dom.max && parseInt(el.dom.value) > el.dom.max) { el.dom.value = el.dom.max; }
                }
            }
        },
        toggleMeridiem: function(params) {
            var el = params.$source,
                toggledValue = el && (el.getAttribute('toggled') !== 'true');

            if (el) el.dom.setAttribute('toggled', toggledValue);
        },
        show: function(options) {
            Sage.Platform.Mobile.Calendar.superclass.show.call(this, options);

            this.showTimePicker = this.options && this.options.showTimePicker;

            this.date  = (this.options && this.options.date) || new Date();
            this.year  = this.date.getFullYear();
            this.month = this.date.getMonth();

            this.hourField.dom.value = "" + pad(this.date.getHours() > 12 ? this.date.getHours() - 12 : (this.date.getHours() || 12));
            this.minuteField.dom.value = "" + pad(this.date.getMinutes());
            this.meridiemField.dom.setAttribute('toggled', this.date.getHours() < 12);

            this.yearField.dom.value  = this.year;
            this.monthField.dom.value = this.month;
            this.dayField.dom.value   = this.date.getDate();
            this.dayField.dom.max  = this.daysInMonth();
            this.yearField.dom.min = this.year - 1;
            this.yearField.dom.max = this.year + 3;

            if (this.showTimePicker)
                this.timeEl.show();
            else
                this.timeEl.hide();
        },
        decrement: function(which) {
            var el  = ('string' == typeof(which)) ? this[which + 'Field'] : this[which.$source.dom.className + 'Field'];
            var val = parseInt(el.dom.value);
            var max = el.dom.max || el.dom.options.length - 1;
            var min = el.dom.min || 0;
            var inc = parseInt(el.dom.step) || 1;
            if (val - inc >= min) {
                el.dom.value = val - inc;
                if (el.dom.id.match('hour') && el.dom.value == (max - 1)) {
                    this.meridiemField.dom.setAttribute('toggled', 'true' != this.meridiemField.dom.getAttribute('toggled'));
                }
            } else {
                if (el.dom.id.match('year')) { return false; }
                if (el.dom.id.match('day')) { this.decrement('month'); }
                if (el.dom.id.match('month')) { this.decrement('year'); }
                if (el.dom.id.match('minute')) { this.decrement('hour'); }
                el.dom.value = inc * Math.floor(max / inc);
            }
            this.validate(null,el);
        },
        increment: function(which) {
            var el  = ('string' == typeof(which)) ? this[which + 'Field'] : this[which.$source.dom.className + 'Field'];
            var val = parseInt(el.dom.value);
            var max = el.dom.max || el.dom.options.length - 1;
            var min = el.dom.min || 0;
            var inc = parseInt(el.dom.step) || 1;
            if (val + inc <= max) {
                el.dom.value = val + inc;
                if (el.dom.id.match('hour') && el.dom.value == max) {
                    this.meridiemField.dom.setAttribute('toggled', 'true' != this.meridiemField.dom.getAttribute('toggled'));
                }
            } else {
                if (el.dom.id.match('year')) { return false; }
                if (el.dom.id.match('day')) { this.increment('month'); }
                if (el.dom.id.match('month')) { this.increment('year'); }
                if (el.dom.id.match('minute')) { this.increment('hour'); }
                el.dom.value = min;
            }
            this.validate(null,el);
            return false;
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
        }
    });
})();
