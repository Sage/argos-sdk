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
 *
 * @alternateClassName Calendar
 */
define('Sage/Platform/Mobile/Calendar', [
    'dojo/_base/declare',
    'dojo/string',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/dom-construct',
    'dojo/dom-style',
    'Sage/Platform/Mobile/View'
], function(
    declare,
    string,
    domAttr,
    domClass,
    domConstruct,
    domStyle,
    View
) {
    var pad = function(n) { return n < 10 ? '0' + n : n };
    var uCase = function (str) { return str.charAt(0).toUpperCase() + str.substring(1); };

    return declare('Sage.Platform.Mobile.Calendar', [View], {
        // Localization
        titleText: 'Calendar',
        amText: 'AM',
        pmText: 'PM',

        id: 'generic_calendar',
        contentNode: null,
        calendarNode: null,
        timeNode: null,
        meridiemNode: null,
        months: Date.CultureInfo.abbreviatedMonthNames,
        dateFormat: Date.CultureInfo.formatPatterns.shortDate,
        timeFormat: Date.CultureInfo.formatPatterns.shortTime,
        is24hrTimeFormat: Date.CultureInfo.formatPatterns.shortTime.match(/H\:/),
        date: false,
        showTimePicker: false,
        timeless: false,
        selectorTemplate:  '<select id="${0}-field" data-dojo-attach-point="${0}Node"></select>',
        incrementTemplate: '<button data-action="increment${0}" class="button">+</button>',
        decrementTemplate: '<button data-action="decrement${0}" class="button">-</button>',
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '<div class="panel-content" id="datetime-picker">',
                    '<div class="calendar-content">',
                    '<table id="datetime-picker-date" data-dojo-attach-point="datePickControl">',
                        '<caption>&nbsp;</caption>',
                        '<tr class="plus">',
                            '<td>{%= $.localizeViewTemplate("incrementTemplate", 0) %}</td>',
                            '<td>{%= $.localizeViewTemplate("incrementTemplate", 1) %}</td>',
                            '<td>{%= $.localizeViewTemplate("incrementTemplate", 2) %}</td>',
                        '</tr>',
                        '<tr class="datetime-selects">',
                            '<td>{%= $.localizeViewTemplate("selectorTemplate", 0) %}</td>',
                            '<td>{%= $.localizeViewTemplate("selectorTemplate", 1) %}</td>',
                            '<td>{%= $.localizeViewTemplate("selectorTemplate", 2) %}</td>',
                        '</tr>',
                        '<tr class="minus">',
                            '<td>{%= $.localizeViewTemplate("decrementTemplate", 0) %}</td>',
                            '<td>{%= $.localizeViewTemplate("decrementTemplate", 1) %}</td>',
                            '<td>{%= $.localizeViewTemplate("decrementTemplate", 2) %}</td>',
                        '</tr>',
                    '</table>',
                    '</div>',
                    '<div class="time-content" data-dojo-attach-point="timeNode">',
                        '<table id="datetime-picker-time" data-dojo-attach-point="timePickControl">',
                            '<caption>&nbsp;</caption>',
                            '<tr class="plus">',
                                '<td>{%= $.localizeViewTemplate("incrementTemplate", 3) %}</td>',
                                '<td>{%= $.localizeViewTemplate("incrementTemplate", 4) %}</td>',
                                '<td rowspan="3">',
                                    '<div class="toggle toggle-vertical meridiem-field" data-action="toggleMeridiem" data-dojo-attach-point="meridiemNode">',
                                        '<span class="thumb vertical"></span>',
                                        '<span class="toggleOn">{%= $.amText %}</span>',
                                        '<span class="toggleOff">{%= $.pmText %}</span>',
                                    '</div>',
                                '</td>',
                            '</tr>',
                            '<tr class="datetime-selects">',
                                '<td>{%= $.localizeViewTemplate("selectorTemplate", 3) %}</td>',
                                '<td>{%= $.localizeViewTemplate("selectorTemplate", 4) %}</td>',
                            '</tr>',
                            '<tr class="minus">',
                                '<td>{%= $.localizeViewTemplate("decrementTemplate", 3) %}</td>',
                                '<td>{%= $.localizeViewTemplate("decrementTemplate", 4) %}</td>',
                            '</tr>',
                        '</table>',
                    '</div>',
                    '<div style="clear:both"></div>',
                '</div>',
            '</div>'
        ]),

        dayNode: null,
        monthNode: null,
        yearNode: null,
        hourNode: null,
        minuteNode: null,
        datePickControl: null,
        timePickControl: null,

        daysInMonth: function() {
            var dlo = (1==this.month) ? 28 : 30;
            var dhi = (1==this.month) ? 29 : 31;
            return (new Date(this.year, this.month, dlo).getMonth() == new Date(this.year, this.month, dhi).getMonth())
                ? dhi
                : dlo
                ;
        },
        init: function() {
            this.inherited(arguments);

            this.connect(this.dayNode,    'onchange', this.validate);
            this.connect(this.monthNode,  'onchange', this.validate);
            this.connect(this.yearNode,   'onchange', this.validate);
            this.connect(this.hourNode,   'onchange', this.validate);
            this.connect(this.minuteNode, 'onchange', this.validate);
        },

        validate: function() {
            this.year = this.yearNode.value;
            this.month = this.monthNode.value;
            // adjust dayNode selector from changes to monthNode or leap/non-leap year
            if (this.dayNode.options.length != this.daysInMonth())
            {
                this.populateSelector(this.dayNode, this.dayNode.selectedIndex + 1, 1, this.daysInMonth());
            }

            this.date = new Date(this.year, this.month, this.dayNode.value);
            var isPM = this.is24hrTimeFormat ? (11 < this.hourNode.value) : domAttr.get(this.meridiemNode, 'toggled') !== true,
                hours = parseInt(this.hourNode.value, 10),
                minutes = parseInt(this.minuteNode.value, 10);
            hours = isPM ? (hours % 12) + 12 : (hours % 12);
            this.date.setHours(hours);
            this.date.setMinutes(minutes);

            this.updateDatetimeCaption();
        },
        toggleMeridiem: function(params) {
            var el = params.$source,
                toggledValue = el && (domAttr.get(el, 'toggled') !== true);

            if (el)
            {
                domClass.toggle(el, 'toggleStateOn');
                domAttr.set(el, 'toggled', toggledValue);
            }

            this.updateDatetimeCaption();
        },
        populateSelector: function(el, val, min, max) {
            if (val > max) { val = max; }
            el.options.length = 0;

            for (var i=min; i <= max; i++)
            {
                var opt = domConstruct.create('option', {
                    innerHTML: (this.monthNode == el) ? uCase(Date.CultureInfo.abbreviatedMonthNames[i]) : pad(i),
                    value: i,
                    selected: (i == val)
                });
                el.options[el.options.length] = opt;
            }
        },
        localizeViewTemplate: function() {
            var whichTemplate = arguments[0],
                formatIndex = arguments[1],
                fields = { y:'year', M:'month', d:'day', h:'hour', H:'hour', m:'minute' };

            var whichField = fields[ (3 > formatIndex)
                ? Date.CultureInfo.formatPatterns.shortDate.split(/[^a-z]/i)[formatIndex].charAt(0)
                : Date.CultureInfo.formatPatterns.shortTime.split(/[^a-z]/i)[formatIndex - 3].charAt(0)
                ];

            var whichFormat = ('selectorTemplate' == whichTemplate)
                ? whichField
                : uCase(whichField);

            return string.substitute(this[whichTemplate], [whichFormat]);
        },
        show: function(options) {
            this.inherited(arguments);

            this.titleText = options.label ? options.label : this.titleText;

            this.showTimePicker = this.options && this.options.showTimePicker;

            this.date  = (this.options && this.options.date) || new Date();
            this.year  = this.date.getFullYear();
            this.month = this.date.getMonth();

            if ((this.options && this.options.timeless) || this.timeless)
                this.date = this.date.clone().add({minutes: this.date.getTimezoneOffset()});

            var today = new Date();

            this.populateSelector(this.yearNode, this.year,
                    (this.year < today.getFullYear() - 10 ? this.year : today.getFullYear() - 10), // min 10 years in past - arbitrary min
                    (10 + today.getFullYear()) // max 10 years into future - arbitrary limit
            );
            this.populateSelector(this.monthNode, this.month, 0, 11);
            this.populateSelector(this.dayNode, this.date.getDate(), 1, this.daysInMonth());
            this.populateSelector(this.hourNode,
                this.date.getHours() > 12 && !this.is24hrTimeFormat
                    ? this.date.getHours() - 12
                    : (this.date.getHours() || 12),
                this.is24hrTimeFormat ? 0 : 1,
                this.is24hrTimeFormat ? 23 : 12
            );
            this.populateSelector(this.minuteNode, this.date.getMinutes(), 0, 59);
            domAttr.set(this.meridiemNode, 'toggled', this.date.getHours() < 12);

            this.updateDatetimeCaption();

            if (this.showTimePicker) {
                domClass.remove(this.timeNode, 'time-content-hidden');
                // hide meridiem toggle when using 24hr time format:
                if (this.is24hrTimeFormat) {
                    domStyle.set(this.meridiemNode.parentNode, 'display', 'none');
                } else if (12 > this.date.getHours()) {
                    // ensure initial toggle state reflects actual time
                    domClass.add(this.meridiemNode, 'toggleStateOn');
                } else {
                    domClass.remove(this.meridiemNode, 'toggleStateOn');
                }
            } else {
                domClass.add(this.timeNode, 'time-content-hidden');
            }
        },

        decrementYear: function() { this.decrement(this.yearNode); },
        decrementMonth: function() { this.decrement(this.monthNode); },
        decrementDay: function() { this.decrement(this.dayNode); },
        decrementHour: function() {
            this.decrement(this.hourNode);
            if (11 == this.hourNode.value % 12)
            {
                this.toggleMeridiem({$source:this.meridiemNode});
            }
        },
        decrementMinute: function() { this.decrement(this.minuteNode, 15); },
        decrement: function(el, inc) { // all fields are <select> elements
            inc = inc || 1;

            if (0 <= (el.selectedIndex - inc))
            {
                el.selectedIndex = inc * Math.floor((el.selectedIndex -1)/ inc);
            }
            else
            {
                if (el == this.yearNode)   { return false; }
                if (el == this.dayNode)    { this.decrementMonth(); }
                if (el == this.monthNode)  { this.decrementYear();  }
                if (el == this.minuteNode) { this.decrementHour();  }
                el.selectedIndex = el.options.length - inc;
            }

            this.validate(null, el);
        },

        incrementYear: function() { this.increment(this.yearNode); },
        incrementMonth: function() { this.increment(this.monthNode); },
        incrementDay: function() { this.increment(this.dayNode); },
        incrementHour: function() {
            this.increment(this.hourNode);

            if (this.hourNode.selectedIndex == (this.hourNode.options.length - 1))
            {
                this.toggleMeridiem({$source:this.meridiemNode});
            }
        },
        incrementMinute: function() { this.increment(this.minuteNode, 15); },
        increment: function(el, inc) {
            inc = inc || 1;

            if (el.options.length > (el.selectedIndex + inc))
            {
                el.selectedIndex += inc;
            }
            else
            {
                if (el == this.yearNode) { return false; }
                if (el == this.dayNode) { this.incrementMonth(); }
                if (el == this.monthNode)  { this.incrementYear(); }
                if (el == this.minuteNode) { this.incrementHour(); }
                el.selectedIndex = 0;
            }

            this.validate(null, el);
        },
        updateDatetimeCaption: function() {
            var t = this.getDateTime();
            this.datePickControl.caption.innerHTML = t.toString('dddd'); // weekday text
            if (this.showTimePicker)
            {
                this.timePickControl.caption.innerHTML = t.toString(Date.CultureInfo.formatPatterns.shortTime);
            }
        },
        getDateTime: function() {
            var result = new Date(this.date.getTime()),
                isPM = this.is24hrTimeFormat ? (11 < this.hourNode.value) : domAttr.get(this.meridiemNode, 'toggled') !== true,
                hours = parseInt(this.hourNode.value, 10),
                minutes = parseInt(this.minuteNode.value, 10);

            hours = isPM
                ? (hours % 12) + 12
                : (hours % 12);

            result.setHours(hours);
            result.setMinutes(minutes);

            if ((this.options && this.options.timeless) || this.timeless)
                result = result.clone().clearTime().add({minutes: -1*result.getTimezoneOffset(), seconds:5});

            return result;
        }
    });
});