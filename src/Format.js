/// <reference path="../libraries/Simplate.js"/>
/// <reference path="../libraries/reui/reui.js"/>
/// <reference path="../libraries/date/date.js"/>
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-dependencies-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-debug.js"/>

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
        }
    };
})();

