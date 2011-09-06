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
    var uCase = function (str) { return str.charAt(0).toUpperCase() + str.substring(1); }

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
            datePickControl: '#datetime-picker-date',
            timePickControl: '#datetime-picker-time',
        },
        viewTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '<div class="panel-content" id="datetime-picker">',
                    '<div class="calendar-content">',
                    '<table id="datetime-picker-date">',
                        '<caption>&nbsp;</caption>',
                        '<tr class="plus">',
                            '<td><button data-action="incrementMonth">+</button></td>',
                            '<td><button data-action="incrementDay">+</button></td>',
                            '<td><button data-action="incrementYear">+</button></td>',
                        '</tr>',
                        '<tr>',
                            '<td><select id="month-field"></select></td>',
                            '<td><select id="day-field"></select></td>',
                            '<td><select id="year-field"></select></td>',
                        '</tr>',
                        '<tr class="minus">',
                            '<td><button data-action="decrementMonth">-</button></td>',
                            '<td><button data-action="decrementDay">-</button></td>',
                            '<td><button data-action="decrementYear">-</button></td>',
                        '</tr>',
                    '</table>',
                    '</div>',
                    '<div class="time-content">',
                        '<table id="datetime-picker-time">',
                            '<caption>&nbsp;</caption>',
                            '<tr class="plus">',
                                '<td><button data-action="incrementHour">+</button></td>',
                                '<td><button data-action="incrementMinute">+</button></td>',
                            '</tr>',
                            '<tr>',
                                '<td><select id="hour-field"></select></td>',
                                '<td><select id="minute-field"></select></td>',
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
                            '<tr class="minus">',
                                '<td><button data-action="decrementHour">-</button></td>',
                                '<td><button data-action="decrementMinute">-</button></td>',
                            '</tr>',
                        '</table>',
                    '</div>',
                '</div>',
            '</div>'
        ]),
        titleText: 'Calendar',
        amText: 'AM',
        pmText: 'PM',
        months: Date.CultureInfo.abbreviatedMonthNames,
        dateFormat: Date.CultureInfo.formatPatterns.shortDate,
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

            this.timeEl.setVisibilityMode(Ext.Element.DISPLAY);

            this.dayField
                .on('change', this.validate, this);
            this.monthField
                .on('change', this.validate, this);
            this.yearField
                .on('change', this.validate, this);
            this.hourField
                .on('change', this.validate, this);
            this.minuteField                
                .on('change', this.validate, this);
        },
        validate: function(event, field) {
            this.year = this.yearField.dom.value;
            this.month = this.monthField.dom.value;
            // adjust dayField selector from changes to monthField or leap/non-leap year
            if(this.dayField.dom.options.length != this.daysInMonth()) {
                this.populateSelector(this.dayField, this.dayField.dom.selectedIndex + 1, 1, this.daysInMonth());
            }

            this.date = new Date(this.year, this.month, this.dayField.dom.value),
                isPM = this.meridiemField.getAttribute('toggled') !== 'true',
                hours = parseInt(this.hourField.getValue(), 10),
                minutes = parseInt(this.minuteField.getValue(), 10);
            hours = isPM ? (hours % 12) + 12 : (hours % 12);
            this.date.setHours(hours);
            this.date.setMinutes(minutes);

            this.updateDatetimeCaption();
        },
        toggleMeridiem: function(params) {
            var el = params.$source,
                toggledValue = el && (el.getAttribute('toggled') !== 'true');

            if (el) el.dom.setAttribute('toggled', toggledValue);
            this.updateDatetimeCaption();
        },
        populateSelector: function(el, val, min, max) {
            if (val > max) { val = max; }
            el.dom.options.length = 0;
            for (var i=min; i <= max; i++) {
                opt = new Option((this.monthField == el) ? uCase(this.months[i]) : pad(i), i);
                opt.selected = (i == val);
                el.dom.options[el.dom.options.length] = opt;
            }
        },
        show: function(options) {
            this.titleText = options.label ? options.label : this.titleText;

            Sage.Platform.Mobile.Calendar.superclass.show.call(this, options);

            this.showTimePicker = this.options && this.options.showTimePicker;

            this.date  = (this.options && this.options.date) || new Date();
            this.year  = this.date.getFullYear();
            this.month = this.date.getMonth();

            var today = new Date();
            this.populateSelector(this.yearField, this.year,
                    (this.year < today.getFullYear() ? this.year : today.getFullYear()),
                    (10 + today.getFullYear()) // max 10 years into future
            );
            this.populateSelector(this.monthField, this.month, 0, 11);
            this.populateSelector(this.dayField, this.date.getDate(), 1, this.daysInMonth());
            this.populateSelector(this.hourField, this.date.getHours() > 12 ? this.date.getHours() - 12 : (this.date.getHours() || 12), 1, 12);
            this.populateSelector(this.minuteField, this.date.getMinutes(), 0, 59);

            this.updateDatetimeCaption();

            if (this.showTimePicker)
                this.timeEl.show();
            else
                this.timeEl.hide();
        },

        decrementYear: function() { this.decrement(this.yearField); },
        decrementMonth: function() { this.decrement(this.monthField); },
        decrementDay: function() { this.decrement(this.dayField); },
        decrementHour: function() {
            this.decrement(this.hourField);
            if ('11' == this.hourField.dom.options[this.hourField.dom.selectedIndex].value ) {
                this.meridiemField.dom.setAttribute('toggled', 'true' != this.meridiemField.dom.getAttribute('toggled'));
            }
        },
        decrementMinute: function() { this.decrement(this.minuteField, 15); },
        decrement: function(el, inc) { // all fields are <select> elements
            var inc = inc || 1;
            if (0 <= (el.dom.selectedIndex - inc)) {
                el.dom.selectedIndex = inc * Math.floor((el.dom.selectedIndex -1)/ inc);
            } else {
                if (el == this.yearField)   { return false; }
                if (el == this.dayField)    { this.decrementMonth(); }
                if (el == this.monthField)  { this.decrementYear();  }
                if (el == this.minuteField) { this.decrementHour();  }
                el.dom.selectedIndex = el.dom.options.length - inc;
            }
            this.validate(null,el);
        },

        incrementYear: function() { this.increment(this.yearField); },
        incrementMonth: function() { this.increment(this.monthField); },
        incrementDay: function() { this.increment(this.dayField); },
        incrementHour: function() {
            this.increment(this.hourField);
            if (this.hourField.dom.selectedIndex == (this.hourField.dom.options.length - 1)) {
                this.meridiemField.dom.setAttribute('toggled', 'true' != this.meridiemField.dom.getAttribute('toggled'));
            }
        },
        incrementMinute: function() { this.increment(this.minuteField, 15); },
        increment: function(el, inc) {
            var inc = inc || 1;
            if (el.dom.options.length > (el.dom.selectedIndex + inc)) {
                el.dom.selectedIndex += inc;
            } else {
                if (el == this.yearField) { return false; }
                if (el == this.dayField) { this.incrementMonth(); }
                if (el == this.monthField)  { this.incrementYear(); }
                if (el == this.minuteField) { this.incrementHour(); }
                el.dom.selectedIndex = 0;
            }
            this.validate(null,el);
        },
        updateDatetimeCaption: function() {
            var t = this.getDateTime();
            this.datePickControl.dom.caption.innerHTML = t.toString('dddd');
            if(this.showTimePicker) {
                this.timePickControl.dom.caption.innerHTML = t.toString('h:mm ') + (
                    this.meridiemField.getAttribute('toggled') !== 'true'
                        ? this.pmText
                        : this.amText
                    );
            }
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
