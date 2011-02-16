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

Sage.Platform.Mobile.Convert = (function() {
    var isoDate = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|(-|\+)(\d{2}):(\d{2}))/,
        jsonDate = /\/Date\((-?\d+)(?:(-|\+)(\d{2})(\d{2}))?\)\//,
        pad = function(n) { return n < 10 ? '0' + n : n };

    return {
        isDateString: function(value) {
            if (typeof value !== 'string')
                return false;
            
            return isoDate.test(value) || jsonDate.test(value);
        },
        toIsoStringFromDate: function(value) {
            // adapted from: https://developer.mozilla.org/en/JavaScript/Reference/global_objects/date
            return value.getUTCFullYear() + '-'
                + pad(value.getUTCMonth() + 1 ) + '-'
                + pad(value.getUTCDate()) + 'T'
                + pad(value.getUTCHours()) + ':'
                + pad(value.getUTCMinutes()) + ':'
                + pad(value.getUTCSeconds()) + 'Z';
        },
        toJsonStringFromDate: function(value) {
            return '/Date(' + value.getTime() + ')/';
        },
        toDateFromString: function(value) {
            if (typeof value !== 'string')
                return value;

            var match,
                utc,
                h, m;

            if ((match = jsonDate.exec(value)))
            {
                utc = new Date(parseInt(match[1]));

                // todo: may not be needed
                /*
                if (match[2])
                {
                    h = parseInt(match[3]);
                    m = parseInt(match[4]);

                    if (match[2] === '-')
                        utc.addMinutes((h * 60) + m);
                    else
                        utc.addMinutes(-1 * ((h * 60) + m));
                }
                */

                value = utc;
            }
            else if ((match = isoDate.exec(value)))
            {
                utc = new Date(Date.UTC(
                    parseInt(match[1]),
                    parseInt(match[2]) - 1, // zero based
                    parseInt(match[3]),
                    parseInt(match[4]),
                    parseInt(match[5]),
                    parseInt(match[6])
                ));

                if (match[8] !== 'Z')
                {
                    h = parseInt(match[10]);
                    m = parseInt(match[11]);
                    
                    if (match[9] === '-')
                        utc.addMinutes((h * 60) + m);
                    else
                        utc.addMinutes(-1 * ((h * 60) + m));
                }

                value = utc;
            }

            return value;
        }
    };
})();

