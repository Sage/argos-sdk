/*!
* ReUI v1.0
* Copyright 2010, Michael Morton
*
* MIT Licensed - See LICENSE
*
* Sections of this code are Copyright (c) 2007-2009, iUI Project Members, and are
* licensed under the terms of the BSD license (see LICENSE.iUI).
*/
ReUI = {};

(function() {
    var R = ReUI,
        isIE = /msie/i.test(navigator.userAgent),
        reForClassCache = {};

    var reForClass = function(cls) {
        return reForClassCache[cls] 
            ? (reForClassCache[cls])
            : (reForClassCache[cls] = new RegExp('(^|\\s)' + cls + '($|\\s)'));
    };

    ReUI.DomHelper = {
        apply: function (a, b, c) {
            var a = a || {};

            if (b) for (var n in b) a[n] = b[n];
            if (c) for (var n in c) a[n] = c[n];

            return a;
        }, 
        dispatch: function(el, type, bubble, cancel, o) {
            if (typeof cancel === 'object')
            {
                var o = cancel;
                var cancel = true;
            }
            else if (typeof bubble === 'object')
            {
                var o = bubble;
                var bubble = true;
                var cancel = true;    
            }

            var o = o || {};

            var evt = document.createEvent("UIEvent");

            evt.initEvent(type, bubble === false ? false : true, cancel === false ? false : true);

            this.apply(evt, o);
        
            el.dispatchEvent(evt);
        },
        bind: isIE 
            ? function(target, type, fn) {
                target.attachEvent(type, fn);
            }
            : function(target, type, fn, capture) {        
                target.addEventListener(type, fn, capture);
            },
        unbind: isIE
            ? function(target, type, fn) {
                target.detachEvent(type, fn);
            }
            : function(target, type, fn, capture) {
                target.removeEventListener(type, fn, capture);
            },
        wait: isIE 
            ? function(fn, delay) {
                var pass = Array.prototype.slice.call(arguments, 2);
                return setTimeout(function() {
                    fn.apply(this, pass);
                }, delay);
            }
            : function() {
                return setTimeout.apply(window, arguments);
            },
        clearWait: function() {
            clearTimeout.apply(window, arguments);
        },
        timer: isIE 
            ? function(fn, delay) {
                var pass = Array.prototype.slice.call(arguments, 2);
                return setInterval(function() {
                    fn.apply(this, pass);
                }, delay);
            }
            : function() {
                return setInterval.apply(window, arguments);
            },
        clearTimer: function() {
            clearInterval.apply(window, arguments);
        },
        hasClass: function(el, cls) {
            return reForClass(cls).test(el.className);
        },
        addClass: function(el, cls) {
            if (this.hasClass(el, cls) == false) el.className += ' ' + cls;            
        },
        removeClass: function(el, cls) {
            if (this.hasClass(el, cls)) el.className = el.className.replace(reForClass(cls), ' ');
        },
        get: function(el) {
            if (typeof el === 'string') return document.getElementById(el);

            return el;
        },
        findAncestorByTag: function(node, name) {
            while (node && (node.nodeType != 1 || node.localName.toLowerCase() != name))
                node = node.parentNode;
            return node;
        },
        isSelected: function(el) {
            return (el.getAttribute('selected') == 'true');
        },
        select: function(el) {
            el.setAttribute('selected', 'true');
        },
        unselect: function(el) {
            el.removeAttribute('selected');
        },
        applyStyle: function(el, style) {
            this.apply(el.style, style);
        }
    };
})();

(function() {  
    var R = ReUI,
        D = ReUI.DomHelper,
        isWebKit = /webkit/i.test(navigator.userAgent),
        originalBackButtonCls;
       
    var resolveFx = function(name) {
        return R.useCompatibleFx 
            ? R.registeredFx[name + 'Compatible']
            : R.registeredFx[name];
    };

    var onRootClick = function(evt) {  
        var evt = evt || window.event;            
        var target = evt.target || evt.srcElement;

        var link = D.findAncestorByTag(target, 'a');
        if (link) 
        {
            var data = extractInfoFromHash(link.hash),
                page = data && D.get(data.page);
            if (page)
            {
                D.select(link);
                    
                R.show(page);

                D.wait(D.unselect, 500, link);
            }
            else if (link == R.backEl)
            {
                R.back();
            }
            else if (link.getAttribute('type') == 'cancel')
            {
                if (context.dialog) D.unselect(context.dialog);                        
            }                      
            else
            {
                return;
            }

            evt.cancelBubble = true;
            if (evt.stopPropagation) evt.stopPropagation();
            if (evt.preventDefault) evt.preventDefault();
        }
    };

    var transitionComplete = function(page, o) {
        if (o.track !== false) 
        {
            if (typeof page.id !== 'string' || page.id.length <= 0)
                page.id = 'reui-' + (context.counter++);
           
            context.hash = location.hash = formatHashForPage(page, o);

            if (o.trimmed !== true)
                context.history.push({
                    hash: context.hash,
                    page: page.id,
                    tag: o.tag,
                    data: o.data
                });
        }

        context.transitioning = false;
  
        if (o.update !== false) 
        {
            if (R.titleEl)
            {
                if (page.title) 
                    R.titleEl.innerHTML = page.title;

                var titleCls = page.getAttribute('titleCls') || page.getAttribute('ttlclass');
                if (titleCls)
                    R.titleEl.className = titleCls;
            }

            /* only update back button if track is set to true, since there is no history entry for the new page */
            if (R.backEl && o.track !== false) 
            {
                var previous = context.history.length > 1
                    ? D.get(context.history[context.history.length - 2].page)
                    : false;
                
                if (previous && previous.getAttribute('hideBackButton') != 'true')
                {
                    if (R.legacyMode)
                        R.backEl.style.display = 'inline';
                    else
                        R.backEl.style.display = '';

                    if (R.updateBackButtonText)
                        R.backEl.innerHTML = previous.title || R.backText;

                    if (!originalBackButtonCls) originalBackButtonCls = R.backEl.className;

                    var backButtonCls = previous.getAttribute('backButtonCls') || previous.getAttribute('bbclass');

                    R.backEl.className = backButtonCls ? originalBackButtonCls + ' ' + backButtonCls : originalBackButtonCls;
                }
                else
                {
                    if (R.legacyMode)
                        R.backEl.style.display = 'none';
                    else
                        R.backEl.style.display = 'none';
                }
            }
        }        
    };  
    
    var transition = function(from, to, o) {            
        function complete() {            
            transitionComplete(to, o); //D.wait(transitionComplete, 0, to, o);

            D.removeClass(R.rootEl, 'transition');

            context.check = D.timer(checkOrientationAndLocation, R.checkStateEvery);                                                               
                
            D.dispatch(from, 'aftertransition', {out: true, tag: o.tag, data: o.data});
            D.dispatch(to, 'aftertransition', {out: false, tag: o.tag, data: o.data});

            if (o.complete)
                o.complete(from, to, o);
        }       
        
        context.transitioning = true;

        D.clearTimer(context.check);

        scrollTo(0, 1);

        D.addClass(R.rootEl, 'transition');

        // dispatch an 'activate' event to let the page be aware that is being show as the result of an external
        // event (i.e. browser back/forward navigation).
        if (o.external) D.dispatch(to, 'activate', {tag: o.tag, data: o.data});

        D.dispatch(from, 'beforetransition', {out: true, tag: o.tag, data: o.data});
        D.dispatch(to, 'beforetransition', {out: false, tag: o.tag, data: o.data});

        if (R.disableFx === true)
        {
            D.unselect(from);
            D.select(to);
            complete();
            return;
        }

        if (typeof o.horizontal !== 'boolean')
        {
            var toHorizontal = to.getAttribute('horizontal');                
            var fromHorizontal = from.getAttribute('horizontal');

            if (toHorizontal === 'false' || fromHorizontal === 'false')
            {
                o.horizontal = false;
            }
        }
            
        var dir = o.horizontal !== false
            ? o.reverse ? 'r' : 'l'
            : o.reverse ? 'd' : 'u';

        var toFx = to.getAttribute('effect');
        var fromFx = from.getAttribute('effect');
        var useFx = fromFx || toFx;

        var fx = resolveFx(useFx) || resolveFx(R.defaultFx);
        if (fx) 
            fx(from, to, dir, complete);
    };

    var extractInfoFromHash = function(hash) {
        if (hash && hash.indexOf(R.hashPrefix) === 0)
        {
            var segments = hash.substr(R.hashPrefix.length).split(';');
            return {
                hash: hash,
                page: segments[0],
                tag: segments.length <= 2 ? segments[1] : segments.slice(1)
            };
        }

        return false;
    };

    var formatHashForPage = function(page, options) {
        var segments = options && options.tag
            ? [page.id].concat(options.tag)
            : [page.id];
        return R.hashPrefix + segments.join(';');       
    };
    
    var getPageFromHash = function(hash) {
        if (hash && hash.indexOf(R.hashPrefix) === 0)
            return D.get(hash.substr(R.hashPrefix.length));
        return false;
    };                   

    var checkOrientationAndLocation = function() {
        if (context.hasOrientationEvent !== true)
        {
            if ((window.innerHeight != context.height) || (window.innerWidth != context.width))
            {
                context.height = window.innerHeight;
                context.width = window.innerWidth;

                setOrientation(context.height < context.width ? 'landscape' : 'portrait');
            }
        }

        if (context.transitioning) return;

        if (context.hash != location.hash)
        {
            // do reverse checking here, loop-and-trim will be done by show
            var reverse = false,
                info,
                page;

            for (var position = context.history.length - 2; position >= 0; position--)
                if (context.history[position].hash == location.hash)
                {
                    info = context.history[position];
                    reverse = true;
                    break;
                }

            info = info || extractInfoFromHash(location.hash);
            page = info && D.get(info.page);

            // more often than not, data will only be needed when moving to a previous view (and restoring it's state).
            
            if (page)
                R.show(page, {external: true, reverse: reverse, tag: info && info.tag, data: info && info.data});
        }         
    };

    var orientationChanged = function() {
        switch (window.orientation) 
        {                
            case 90:
            case -90:
                setOrientation('landscape');
                break;
            default:
                setOrientation('portrait');
                break;
        }
    };

    var setOrientation = function(value) {
        R.rootEl.setAttribute('orient', value);

        if (value == 'portrait') 
        {
            D.removeClass(R.rootEl, 'landscape');
            D.addClass(R.rootEl, 'portrait');
        }
        else if (value == 'landscape')
        {
            D.removeClass(R.rootEl, 'portrait');
            D.addClass(R.rootEl, 'landscape');
        }
        else
        {
            D.removeClass(R.rootEl, 'portrait');
            D.removeClass(R.rootEl, 'landscape');
        }

        D.wait(scrollTo, 100, 0, 1); 
    };

    var context = {
        page: false,
        dialog: false,
        transitioning: false, // todo: rename to something more appropriate
        initialized: false,
        counter: 0,
        width: 0,
        height: 0,
        check: 0,
        hasOrientationEvent: false, 
        history: []      
    };

    var config = window['reConfig'] || {};
    
    D.apply(ReUI, {
        autoInit: true,
        legacyMode: true,
        useCompatibleFx: !isWebKit,
        registeredFx: {},
        disableFx: false,
        defaultFx: 'slide',
        rootEl: false, 
        titleEl: false,      
        backEl: false,
        updateBackButtonText: true,
        hashPrefix: '#_',
        backText: 'Back',               
        checkStateEvery: 100,
        prioritizeLocation: false,
        showInitialPage: true,
        context: context,

        init: function() {
            if (context.initialized) 
                return;

            context.initialized = true;

            R.rootEl = R.rootEl || document.body;            
            R.backEl = R.backEl || D.get('backButton');
            R.titleEl = R.titleEl || D.get('pageTitle');

            var selectedEl, hashEl;
            var el = R.rootEl.firstChild;            
            for (; el; el = el.nextSibling)
                if (el.nodeType == 1 && el.getAttribute('selected') == 'true')
                    selectedEl = el;

            if (location.hash)
            {
                hashEl = getPageFromHash(location.hash);
            }           

            if (R.showInitialPage)
            {
                if (R.prioritizeLocation)
                {
                    if (hashEl)
                    {
                        if (selectedEl) D.unselect(selectedEl);

                        R.show(hashEl);
                    }
                    else if (selectedEl)
                    {
                        R.show(selectedEl);
                    }
                }
                else
                {
                    if (selectedEl)
                    {
                        R.show(selectedEl);
                    }
                    else if (hashEl)
                    {
                        R.show(hashEl);
                    }
                }
            }
            
            if (typeof window.onorientationchange === 'object')
            {
                window.onorientationchange = orientationChanged;

                context.hasOrientationEvent = true;    
                
                D.wait(orientationChanged, 0);
            }

            if (R.showInitialPage)
            {
                D.wait(checkOrientationAndLocation, 0);
            }

            context.check = D.timer(checkOrientationAndLocation, R.checkStateEvery);

            D.bind(R.rootEl, 'click', onRootClick);
        },

        registerFx: function(name, compatible, fn) {
            if (typeof compatible === 'function')
            {
                fn = compatible;
                compatible = false;
            }

            if (compatible)
                R.registeredFx[name + 'Compatible'] = fn;
            else
                R.registeredFx[name] = fn;
        },

        getCurrentPage: function() {
            return context.page;
        },

        getCurrentDialog: function() {
            return context.dialog;
        },

        back: function() {
            history.back();
        },
        
        /// <summary>
        /// Available Options:
        ///     horizontal: True if the transition is horizontal, False otherwise.
        ///     reverse: True if the transition is a reverse transition (right/down), False otherwise.
        ///     track: False if the transition should not be tracked in history, True otherwise.
        ///     update: False if the transition should not update title and back button, True otherwise.
        ///     scroll: False if the transition should not scroll to the top, True otherwise.
        /// </summary>
        show: function(page, o) {
            if (context.transitioning)
                return;

            var o = o || {},
                page = typeof page === 'string'
                    ? D.get(page)
                    : page;

            if (!page) return;

            if (D.isSelected(page)) return;

            context.transitioning = true;
           
            if (o.track !== false)
            {
                var count = context.history.length,
                    hash = formatHashForPage(page, o),
                    position = -1;

                // do loop and trim
                for (position = count - 1; position >= 0; position--)
                    if (context.history[position].hash == hash)
                        break;

                if (position > -1)
                {
                    context.history = context.history.splice(0, position + 1);
                    context.hash = hash;

                    // indicate that context.history has already been taken care of (i.e. nothing needs to be pushed).
                    o.trimmed = true;
                    
                    // trim up the browser history
                    // if the requested hash does not equal the current location hash, trim up history.
                    // location hash will not match requested hash when show is called directly, but will match
                    // for detected location changes (i.e. the back button).
                    if (location.hash != hash) history.go(position - (count - 1));
                }
                else if (o.returnTo)
                {
                    if (typeof o.returnTo === 'function')
                    {
                        for (position = count - 1; position >= 0; position--)
                            if (o.returnTo(context.history[position]))
                                break;
                    }
                    else if (o.returnTo < 0)
                    {
                        position = (count - 1) + o.returnTo;
                    }

                    if (position > -1)
                    {
                        // we fix up the history, but do not flag as trimmed, since we do want the new view to be pushed.
                        context.history = context.history.splice(0, position + 1);
                        context.hash = context.history[context.history.length - 1] && context.history[context.history.length - 1].hash;

                        if (location.hash != hash) history.go(position - (count - 1));
                    }
                }
            }

            // don't auto-scroll by default if reversing
            if (o.reverse && typeof o.scroll === 'undefined') o.scroll = !o.reverse;

            if (context.dialog)
            {
                D.dispatch(context.dialog, 'beforetransition', {out: true});

                D.unselect(context.dialog);

                D.dispatch(context.dialog, 'aftertransition', {out: true});

                D.dispatch(context.dialog, 'blur', false);

                context.dialog = false;
            }  

            if (D.hasClass(page, 'dialog'))
            {
                D.dispatch(page, 'beforetransition', {out: false});

                D.select(page);

                D.dispatch(page, 'aftertransition', {out: false});

                D.dispatch(page, 'focus', false);

                context.transitioning = false;
                context.dialog = page;
            }
            else
            {
                D.dispatch(page, 'load', false);

                var from = context.page;

                if (context.page) D.dispatch(context.page, 'blur', false);

                context.page = page;

                D.dispatch(page, 'focus', false);

                if (from)
                {
                    if (o.reverse) D.dispatch(context.page, 'unload', false);

                    D.wait(transition, 0, from, page, o);
                }       
                else
                {
                    D.dispatch(page, 'beforetransition', {out: false, tag: o.tag, data: o.data});

                    D.select(page);

                    transitionComplete(page, o);
                    
                    D.dispatch(page, 'aftertransition', {out: false, tag: o.tag, data: o.data});
                }
            }
        }                    
    }, config);

    D.bind(window, 'load', function(evt) {
        if (R.autoInit)
            R.init();
    });
})();

(function() {
    var R = ReUI,
        D = ReUI.DomHelper;

    R.registerFx('slide', function(from, to, dir, fn) {              
        var toStart = {value: '0%', axis: 'X'};
        var fromStop = {value: '0%', axis: 'X'};            

        switch (dir) 
        {
            case 'l': 
                toStart.value = (window.innerWidth) + 'px';
                toStart.axis = 'X';
                fromStop.value = '-100%';
                fromStop.axis = 'X';
                break;
            case 'r':
                toStart.value = (-1 * window.innerWidth) + 'px';
                toStart.axis = 'X';
                fromStop.value = '100%';
                fromStop.axis = 'X';
                break;
            case 'u':
                toStart.value = (window.innerHeight) + 'px';
                toStart.axis = 'Y';
                fromStop.value = '-100%';
                fromStop.axis = 'Y';
                break;
            case 'd':
                toStart.value = (-1 * window.innerHeight) + 'px';
                toStart.axis = 'Y';
                fromStop.value = '100%';
                fromStop.axis = 'Y';
                break;
        };
      
        D.applyStyle(to, {
            'webkitTransitionDuration': '0ms',
            'webkitTransitionProperty': '-webkit-transform',
            'webkitTransform': 'translate' + toStart.axis + '(' + toStart.value + ')'
        });
            
        D.select(to);

        D.applyStyle(to, {
            'webkitTransitionDuration': 'inherit'
        });
                
        D.applyStyle(from, {
            'webkitTransitionDuration': 'inherit',
            'webkitTransitionProperty': '-webkit-transform'
        });

        function complete() {
            D.unbind(from, 'webkitTransitionEnd', complete, false);

            D.applyStyle(to, {
                'webkitTransitionProperty': 'inherit'
            }); 
            
            D.applyStyle(from, {
                'webkitTransitionProperty': 'inherit'
            });

            if (D.hasClass(to, 'dialog') == false) D.unselect(from);  
     
            if (typeof fn === 'function') fn();
        };
            
        D.bind(from, 'webkitTransitionEnd', complete, false);            
        D.wait(function() {            
            D.applyStyle(from, {
                'webkitTransform': 'translate' + fromStop.axis + '(' + fromStop.value + ')'
            });

            D.applyStyle(to, {
                'webkitTransform': 'translate' + toStart.axis + '(0%)'
            });
        }, 0);            
    });

    R.registerFx('slide', true, function(from, to, dir, fn) {        
        var toData = {prop: 'left', dir: 1, value: 0},
            fromData = {prop: 'left', dir: 1, value: 0};            

        switch (dir) 
        {
            case 'l':
                toData.prop = 'left';
                toData.dir = -1;
                toData.value = 100;
                fromData.prop = 'left';
                fromData.dir = -1;
                fromData.value = 0;
                break;
            case 'r':
                toData.prop = 'right';
                toData.dir = -1;
                toData.value = 100;
                fromData.prop = 'right';
                fromData.dir = -1;
                fromData.value = 0;
                break;
            case 'u':
                toData.prop = 'top';
                toData.dir = -1;
                toData.value = 100;
                fromData.prop = 'top';
                fromData.dir = -1;
                fromData.value = 0;
                break;
            case 'd':
                toData.prop = 'bottom';
                toData.dir = -1;
                toData.value = 100;
                fromData.prop = 'bottom';
                fromData.dir = -1;
                fromData.value = 0;
                break;
        };

        var speed = R.stepSpeed || 10,
            interval = R.stepInterval || 0,
            frames = 100 / speed,
            count = 1;
        
        step();

        D.select(to);
        
        var timer = D.timer(step, interval);    

        function step() {            
            var toStyle = {},
                fromStyle = {};

            if (count > frames)
            {
                D.clearTimer(timer);
                
                if (D.hasClass(to, 'dialog') == false) D.unselect(from); 

                toStyle[toData.prop] = 'inherit';                
                fromStyle[fromData.prop] = 'inherit';

                D.applyStyle(to, toStyle);
                D.applyStyle(from, fromStyle);

                if (typeof fn === 'function') fn();

                return;
            }            

            toStyle[toData.prop] = toData.value + (toData.dir * (count * speed)) + '%';
            fromStyle[fromData.prop] = fromData.value + (fromData.dir * (count * speed)) + '%';

            D.applyStyle(to, toStyle);
            D.applyStyle(from, fromStyle);
            
            count++;
        };           
    });

    R.registerFx('flip', function(from, to, dir, fn) {             
        var toStart = {value: '0deg', axis: 'Y'};
        var fromStop = {value: '0deg', axis: 'Y'};            

        switch (dir) 
        {
            case 'l': 
                toStart.value = '-180deg';
                toStart.axis = 'Y';
                fromStop.value = '180deg';
                fromStop.axis = 'Y';
                break;
            case 'r':
                toStart.value = '180deg';
                toStart.axis = 'Y';
                fromStop.value = '-180deg';
                fromStop.axis = 'Y';
                break; 
            case 'u': 
                toStart.value = '-180deg';
                toStart.axis = 'X';
                fromStop.value = '180deg';
                fromStop.axis = 'X';
                break;
            case 'd':
                    toStart.value = '180deg';
                toStart.axis = 'X';
                fromStop.value = '-180deg';
                fromStop.axis = 'X';
                break;                 
        };
        
        D.applyStyle(to, {
            'webkitTransitionDuration': '0ms',
            'webkitTransitionProperty': '-webkit-transform',
            'webkitTransform': 'rotate' + toStart.axis + '(' + toStart.value + ')',
            'webkitTransformStyle': 'flat',
            'webkitBackfaceVisibility': 'hidden'
        });                   
            
        D.select(to);

        D.applyStyle(to, {
            'webkitTransitionDuration': 'inherit'
        });

        D.applyStyle(from, {
            'webkitTransitionDuration': 'inherit',
            'webkitTransitionProperty': '-webkit-transform',
            'webkitTransformStyle': 'flat',
            'webkitBackfaceVisibility': 'hidden'
        });

        function complete() {
            D.unbind(from, 'webkitTransitionEnd', complete, false);

            D.applyStyle(to, {
                'webkitTransitionProperty': 'inherit'
            });
            
            D.applyStyle(from, {
                'webkitTransitionProperty': 'inherit'
            });
     
            if (D.hasClass(to, 'dialog') == false) D.unselect(from); 
                
            if (typeof fn === 'function') fn();
        };
            
        D.bind(from, 'webkitTransitionEnd', complete, false);            
        D.wait(function() {
            D.applyStyle(from, {
                'webkitTransform': 'rotate' + fromStop.axis + '(' + fromStop.value + ')'
            });
          
            D.applyStyle(to, {
                'webkitTransform': 'rotate' + toStart.axis + '(0deg)'
            });
        }, 0);     
    });
})();

