/// <reference path="../libraries/Simplate.js"/>
/// <reference path="../libraries/reui/reui.js"/>
/// <reference path="../libraries/date/date.js"/>
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-dependencies-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-debug.js"/>

Ext.namespace('Sage.Platform.Mobile');

Sage.Platform.Mobile.Convert = (function() {
    var isoDate = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(Z|(-|\+)(\d{2}):(\d{2}))/,
        jsonDate = /\/Date\((\d+)(?:(-|\+)(\d{2})(\d{2}))?\)\//,
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

                if (match[7] !== 'Z')
                {
                    h = parseInt(match[9]);
                    m = parseInt(match[10]);
                    
                    if (match[8] === '-')
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

