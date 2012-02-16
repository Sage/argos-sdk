/*!
 * simplate-js v1.1
 * Copyright 2010, Michael Morton
 *
 * MIT Licensed - See LICENSE.txt
 */
(function(window, undefined) {
    var trimRE = /^\s+|\s+$/g,
        testRE = /(,)/,
        escQuoteRE = /'/g,
        escNewLineRE = /\n/g,
        entAmpRE = /&/g,
        entLtRE = /</g,
        entGtRE = />/g,
        entQuotRE = /"/g,
        cache = {},
        cacheRE = {},
        useCompatibleParser = ('is,ie'.split(testRE).length != 3),
        options = {
            tags: {
                begin: "{%",
                end: "%}"
            },
            allowWith: false
        };

    var mix = function(a, b, c) {
        if (c) for (var n in c) a[n] = c[n];
        if (b) for (var n in b) a[n] = b[n];
        return a;
    };

    var encode = function(val) {
        if (typeof val !== 'string') return val;

        return val
            .replace(entAmpRE, '&amp;')
            .replace(entLtRE, '&lt;')
            .replace(entGtRE, '&gt;')
            .replace(entQuotRE, '&quot;');
    };

    var escape = function(val) {
        return val
            .replace(escQuoteRE, '\\\'')
            .replace(escNewLineRE, '\\n');
    };

    var trim = function(val) {
        return val.replace(trimRE, '');
    };
        
    var parse = function(markup, o) {

        var tagBegin = o.tags.begin,
            tagEnd = o.tags.end;

        if (!useCompatibleParser)
        {
            var key = tagBegin + tagEnd,
                regex = cacheRE[key] || (cacheRE[key] = new RegExp(tagBegin + '(.*?)' + tagEnd));
            
            return markup.split(regex);
        }

        var nextBegin = 0,
            nextEnd = 0,
            markers = [];

        while ((nextBegin = markup.indexOf(tagBegin, nextEnd)) != -1 &&
               (nextEnd = markup.indexOf(tagEnd, nextBegin)) != -1)
        {
            markers[markers.length] = nextBegin;
            markers[markers.length] = nextEnd;
        }

        var fragments = [],
            at = 0;

        for (var i = 0; i < markers.length; i++)
        {
            fragments[fragments.length] = markup.substr(at, markers[i] - at);
            at = markers[i] + ((i % 2) ? tagEnd.length : tagBegin.length);
        }

        fragments.push(markup.substr(at));

        return fragments;
    };

    var make = function(markup, o) {
        if (markup.join) markup = markup.join('');
        if (cache[markup]) return cache[markup];

        var o = mix({}, o, options),
            fragments = parse(markup, o);

        /* code fragments */
        for (var i = 1; i < fragments.length; i += 2)
        {
            if (fragments[i].length > 0)
            {
                var control = fragments[i].charAt(0),
                    source = fragments[i].substr(1);

                switch (control)
                {
                    case '=':
                        fragments[i] = '__r.push(' + source + ');';
                        break;
                    case ':':
                        fragments[i] = '__r.push(__s.encode(' + source + '));';
                        break;
                    case '!':
                        fragments[i] = '__r.push(' + trim(source) + '.apply(__v, __c));';
                        break;
                    default:
                        break;
                }
            }
        }

        for (var i = 0; i < fragments.length; i += 2)
            fragments[i] = '__r.push(\'' + escape(fragments[i]) + '\');';

        fragments.unshift(
            'var __r = [], $ = __v, $$ = __c, __s = Simplate;',
            options.allowWith ? 'with ($ || {}) {' : ''
        );

        fragments.push(
            options.allowWith ? '}': '',
            'return __r.join(\'\');'
        );
       
        var fn;

        try
        {
            fn = new Function('__v, __c', fragments.join(''));
        }
        catch (e)
        {
            fn = function(values) { return e.message; };
        }

        return (cache[markup] = fn);
    };

    var Simplate = function(markup, o) {
        this.fn = make(markup, o);
    };

    mix(Simplate, {
        options: options,
        encode: encode,
        make: make
    });

    mix(Simplate.prototype, {
        apply: function(data, container) {
            return this.fn.call(container || this, data, container || data);
        }
    });

    window.Simplate = Simplate;
})(window);