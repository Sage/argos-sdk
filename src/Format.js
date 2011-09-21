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

define('Sage/Platform/Mobile/Format', ['dojo', 'dojo/string'], function() {
    dojo.declare('Sage.Platform.Mobile.Format', null, {});
    Sage.Platform.Mobile.Format = (function() {
        function isEmpty(val) {
            if (typeof val !== 'string') return !val;

            return (val.length <= 0);
        }

        function encode(val) {
            if (typeof val !== 'string') return val;

            return val
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }

        function decode(val) {
            if (typeof val !== 'string') return val;

            return val
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"');
        }

        return {
            encode: encode,
            isEmpty: isEmpty,
            link: function(val) {
                if (typeof val !== 'string')
                    return val;

                return dojo.string.substitute('<a target="_blank" href="http://${0}">${0}</a>', [val]);
            },
            mail: function(val) {
                if (typeof val !== 'string')
                    return val;

                return dojo.string.substitute('<a href="mailto:${0}">${0}</a>', [val]);
            },
            trim: function(val) {
                return val.replace(/^\s+|\s+$/g,'');
            },
            date: function(val, fmt, utc) {
                var date = val instanceof Date
                    ? val
                    : Sage.Platform.Mobile.Convert.isDateString(val)
                        ? Sage.Platform.Mobile.Convert.toDateFromString(val)
                        : null;

                if (date)
                {
                    if (utc) date = date.clone().add({minutes: date.getTimezoneOffset()});

                    return date.toString(fmt || Date.CultureInfo.formatPatterns.shortDate);
                }

                return val;
            },
            fixed: function(val, d) {
                if (typeof d !== 'number')
                    d = 2;

                var m = Math.pow(10, d),
                    v = Math.floor(parseFloat(val) * m) / m;

                return v;
            },
            percent: function(val) {
                    var intVal = Math.floor(100 * (parseFloat(val) || 0));
                    return intVal + "%";
            },
            yesNo: function(val) {
                if (typeof val === 'string') val = /^true$/i.test(val);

                return val
                    ? Sage.Platform.Mobile.Format.yesText || 'Yes'
                    : Sage.Platform.Mobile.Format.noText || 'No';
            },
            bool: function(val) {
                if (typeof val === 'string') val = /^true$/i.test(val);

                return val
                    ? Sage.Platform.Mobile.Format.trueText || 'T'
                    : Sage.Platform.Mobile.Format.falseText || 'F';
            },
            nl2br: function(val) {
                if (typeof val !== 'string') return val;

                return val.replace(/\n/g, '<br />');
            },
            timespan: function(val) {
                var v = Sage.Platform.Mobile.Format.fixed(val);
                var format = Sage.Platform.Mobile.Format;

                if (isNaN(v) || !v) return '';

                var hrs = Math.floor(v / 60);
                var mins  = v % 60;

                if (hrs)
                    hrs = hrs > 1 ? dojo.string.substitute('${0} ${1} ', [hrs, (format.hoursText || 'hours')])
                                  : dojo.string.substitute('${0} ${1} ', [hrs, (format.hourText || 'hour')]);
                if (mins)
                    mins = mins > 1 ? dojo.string.substitute('${0} ${1}', [mins, (format.minutesText || 'minutes')])
                                    : dojo.string.substitute('${0} ${1}', [mins, (format.minuteText || 'minute')]);

                return (hrs && mins) ? hrs + mins
                                     : hrs === 0 ? mins : hrs;
            }
        };
    })();
});

