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

Ext.namespace('Sage.Platform.Mobile');

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

            return String.format('<a target="_blank" href="http://{0}">{0}</a>', val);
        },
        mail: function(val) {
            if (typeof val !== 'string')
                return val;

            return String.format('<a href="mailto:{0}">{0}</a>', val);            
        },        
        trim: function(val) {
            return val.replace(/^\s+|\s+$/g,'');
        },
        date: function(val, fmt) {
            if (val instanceof Date) return val.toString(fmt || 'M/d/yyyy');

            if (Sage.Platform.Mobile.Convert.isDateString(val))
                val = Sage.Platform.Mobile.Convert.toDateFromString(val);
            else
                return val;

            return val.toString(fmt || 'M/d/yyyy');
        },
        fixed: function(val, d) {
            if (typeof d !== 'number')
                d = 2;

            var m = Math.pow(10, d),
                v = Math.floor(parseFloat(val) * m) / m;

            return v;
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
                hrs = hrs > 1 ? String.format('{0} {1} ', hrs, (format.hoursText || 'hours')) 
                              : String.format('{0} {1} ', hrs, (format.hourText || 'hour'));
            if (mins)
                mins = mins > 1 ? String.format('{0} {1}', mins, (format.minutesText || 'minutes'))
                                : String.format('{0} {1}', mins, (format.minuteText || 'minute'));

            return (hrs && mins) ? hrs + mins
                                 : hrs === 0 ? mins : hrs;
        }
    };
})();

