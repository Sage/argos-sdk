/// <reference path="../libraries/reui/reui.js"/> 
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-dependencies-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-debug.js"/>
/// <reference path="Format.js"/>
/// <reference path="Utility.js"/>

Ext.namespace('Sage.Platform.Mobile');

// todo: where to place these?
Ext.USE_NATIVE_JSON = true;

// see: http://www.sencha.com/forum/showthread.php?44422-OPEN-518-3.x-2.x-Bug-in-radiogroup-when-using-brackets-in-name
Ext.DomQuery.matchers[2] = {
    re: /^(?:([\[\{])(?:@)?([\w-]+)\s?(?:(=|.=)\s?(["']?)(.*?)\4)?[\]\}])/,
    select: 'n = byAttribute(n, "{2}", "{5}", "{3}", "{1}");'
};

Sage.Platform.Mobile.Application = Ext.extend(Ext.util.Observable, {
    defaultServerName: window.location.hostname,    
    defaultPort: window.location.port && window.location.port != 80 ? window.location.port : false,
    defaultProtocol: /https/i.test(window.location.protocol) ? 'https' : false,
    constructor: function() {
        /// <field name="initialized" type="Boolean">True if the application has been initialized; False otherwise.</field>
        /// <field name="context" type="Object">A general store for global context data.</field>
        /// <field name="views" elementType="Sage.Platform.Mobile.View">A list of registered views.</field>
        /// <field name="viewsById" type="Object">A map for looking up a view by its ID.</field>

        Sage.Platform.Mobile.Application.superclass.constructor.call(this);

        this.initialized = false;
        this.enableCaching = false;        
        this.context = {view: []};
        this.views = {};   
        this.services = {};
        this.defaultService = false; 
        this.bars = {};    
        this.addEvents(
            'resize',
            'registered',
            'beforeviewtransitionaway',
            'beforeviewtransitionto',
            'viewtransitionaway',
            'viewtransitionto',
            'viewactivate'
        );
    },
    setup: function() {
        /// <summary>
        ///     Sets up the handling for transition events from iUI.
        /// </summary>
        Ext.EventManager.on(window, 'resize', function() {
            this.fireEvent('resize');
        }, this, {buffer: 250});
        Ext.getBody().on('beforetransition', function(evt, el, o) {
            var view = this.getView(el);
            if (view)
            {
                if (evt.browserEvent.out)
                    this.beforeViewTransitionAway(view);
                else
                    this.beforeViewTransitionTo(view);               
            }
        }, this);
        Ext.getBody().on('aftertransition', function(evt, el, o) {
            var view = this.getView(el);
            if (view)
            {
                if (evt.browserEvent.out)
                    this.viewTransitionAway(view);
                else
                    this.viewTransitionTo(view);
            }
        }, this);
        Ext.getBody().on('activate', function(evt, el, o) {
            var view = this.getView(el);
            if (view)
                this.viewActivate(view, evt.browserEvent.tag, evt.browserEvent.data);
        }, this);
                
        if (this.enableCaching)
        {
            if (this.isOnline())
                this.clearSDataRequestCache();
        }      
    },   
    isOnline: function() {
        return window.navigator.onLine;
    },
    clearSDataRequestCache: function() { 
        var check = function(k) {
            return /^sdata\.cache/i.test(k);
        };
                
        /* todo: find a better way to detect */
        for (var i = window.localStorage.length - 1; i >= 0 ; i--) 
        {
            var key = window.localStorage.key(i);
            if (check(key))
                window.localStorage.removeItem(key);
        }
    },
    createCacheKey: function(request) {
        return 'sdata.cache[' + request.build() + ']';
    },
    loadSDataRequest: function(request, o) {
        /// <param name="request" type="Sage.SData.Client.SDataBaseRequest" />   
        if (this.isOnline()) return;
        
        var key = this.createCacheKey(request); 
        var feed = window.localStorage.getItem(key);   
        if (feed)
        {
            o.result = Ext.decode(feed);
        }                    
    },
    cacheSDataRequest: function(request, o, feed) {        
        /* todo: decide how to handle PUT/POST/DELETE */
        if (/get/i.test(o.method) && typeof feed === 'object')
        {
            var key = this.createCacheKey(request);

            window.localStorage.removeItem(key);
            window.localStorage.setItem(key, Ext.encode(feed));            
        }
    },
    init: function() { 
        /// <summary>
        ///     Initializes this application as well as the toolbar and all currently registered views.
        /// </summary>        
        this.setup();

        for (var n in this.bars) 
            this.bars[n].init();

        for (var n in this.views)
            this.views[n].init();        

        this.initialized = true;
    },
    registerService: function(name, s, o) {
        var o = o || {};

        if (s instanceof Sage.SData.Client.SDataService)        
            var service = s;
        else        
            var service = new Sage.SData.Client.SDataService(s);                

        this.services[name] = service;
        
        if (this.enableCaching && o.offline)
        {
            service.on('beforerequest', this.loadSDataRequest, this);
            service.on('requestcomplete', this.cacheSDataRequest, this);
        }        

        if (o.isDefault || !this.defaultService)
        {
            this.defaultService = service;
        }

        return this;
    },  
    hasService: function(name) {
        return (typeof this.services[name] !== 'undefined');
    },  
    registerView: function(view) {
        /// <summary>
        ///     Registers a view with the application.  If the application has already been 
        ///     initialized, the view is immediately initialized as well.
        /// </summary>
        /// <param name="view" type="Sage.Platform.Mobile.View">The view to be registered.</param>
        this.views[view.id] = view;

        if (this.initialized) view.init();

        this.fireEvent('registered', view);

        return this;
    },
    registerToolbar: function(name, tbar)
    {
        if (typeof name === 'object')
        {
            tbar = name;
            name = tbar.name;
        }

        this.bars[name] = tbar;

        if (this.initialized) tbar.init();

        return this;
    },
    getViews: function() {
        /// <returns elementType="Sage.Platform.Mobile.View">An array containing the currently registered views.</returns>
        var r = [];
        for (var n in this.views) r.push(this.views[n]);
        return r;
    },
    getActiveView: function() {
        /// <returns type="Sage.Platform.Mobile.View">The currently active view.</returns>        
        var el = ReUI.getCurrentPage() || ReUI.getCurrentDialog();
        if (el)
            return this.getView(el);

        return null;
    },    
    getView: function(key) {
        /// <returns type="Sage.Platform.Mobile.View">The requested view.</returns>
        /// <param name="key" type="String">
        ///     1: id - The id of the view to get.
        ///     2: element - The main element of the view to get.        
        /// <param>
        if (key)
        {
            if (typeof key === 'string')
                return this.views[key];
            
            if (typeof key === 'object' && typeof key.id === 'string')
                return this.views[key.id];                
        }
        return null;
    },
    getService: function(name) {
        /// <returns type="Sage.SData.Client.SDataService">The application's SData service instance.</returns>
        if (typeof name === 'string' && this.services[name]) 
            return this.services[name];

        return this.defaultService;
    },
    setTitle: function(title) {
        /// <summary>Sets the applications current title.</summary>
        /// <param name="title" type="String">The new title.</summary>
        for (var n in this.bars)
            if (this.bars[n].setTitle)
                this.bars[n].setTitle(title);
    },    
    beforeViewTransitionAway: function(view) {
        this.fireEvent('beforeviewtransitionaway', view);

        view.beforeTransitionAway();
    },
    beforeViewTransitionTo: function(view) {
        this.fireEvent('beforeviewtransitionto', view);

        for (var n in this.bars)
            this.bars[n].clear();

        view.beforeTransitionTo();
    },
    viewTransitionAway: function(view) {
        this.fireEvent('viewtransitionaway', view);

        view.transitionAway();
    },
    viewTransitionTo: function(view) {
        this.fireEvent('viewtransitionto', view);

        var tools = view.options ? (view.options.tools || view.tools) : (view.tools); 

        if (tools)
        {
            for (var n in tools)
                if (this.bars[n])
                    this.bars[n].display(tools[n]);
        }

        if (this.context.view.unshift(view.getContext()) > 10)
            this.context.view.pop();

        view.transitionTo();
    },
    viewActivate: function(view, tag, data) {
        this.fireEvent('viewactivate', view, tag, data);

        view.activate(tag, data);
    },
    queryNavigationContext: function(predicate, depth, scope) {
        if (typeof depth !== 'number')
        {
            scope = depth;
            depth = 0;
        }

        var list = ReUI.context.history || [],
            depth = depth || 0;

        for (var i = list.length - 2, j = 0; i >= 0 && (depth <= 0 || j < depth); i--, j++)
            if (predicate.call(scope || this, list[i].data)) return list[i].data;

        return false;
    }
});

Ext.onReady(function(){
    var isApple = /(iphone|ipad|ipod)/i.test(navigator.userAgent),
        isMobile = (typeof window.orientation !== 'undefined'),
        onlyHorizontalSwipe = true,
        root = Ext.get(document.documentElement),
        minSwipeLength = 100.0,
        maxSwipeTime = 0.5,
        minLongClickTime = 1.0,
        longPressTime = 1.5,
        maxLongClickLength = 5.0,
        startAt,
        startTime,
        originalTarget,
        preventClick = false,
        longPressTimer = false;

    var touchClick = function(evt) {
        ReUI.DomHelper.unbind(evt.target || evt.srcElement, 'click', touchClick, true);

        if (evt.preventBubble) evt.preventBubble();
        if (evt.preventDefault) evt.preventDefault();
        if (evt.stopPropagation) evt.stopPropagation();
        if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();

        return false;
    };
    var longPress = function(evt, el) {
      if (longPressTimer) clearTimeout(longPressTimer);

      ReUI.DomHelper.dispatch(el, 'longpress');
      return false;
    };
    var touchMove = function(evt, el, o) {
        /* for general swipe, we do not need mouse move */
    };  
    var touchStart = function(evt, el, o) {
        preventClick = false;
        originalTarget = el;
        startAt = evt.getXY();
        startTime = (new Date()).getTime();
        longPressTimer = setTimeout(function(){ longPress(evt, el); }, (longPressTime * 1000));
    };    
    var touchEnd = function(evt, el, o) {
        if (longPressTimer) clearTimeout(longPressTimer);

        var endAt = evt.getXY(),
            endTime = (new Date()).getTime();

        var duration = (endTime - startTime) / 1000.0,
            direction = {x: endAt[0] - startAt[0], y: endAt[1] - startAt[1]},
            length = Math.sqrt(direction.x * direction.x + direction.y * direction.y),        
            normalized = {x: direction.x / length, y: direction.y / length},
            dotProd = normalized.x * 0.0 + normalized.y * 1.0;            

        if (duration <= maxSwipeTime && length >= minSwipeLength)
        {
            var swipe;
            if (!onlyHorizontalSwipe)
            {
                if (dotProd >= 0.71)
                    swipe = 'down';            
                else if (dotProd <= -0.71)            
                    swipe = 'up';            
                else if (normalized.x < 0.0)
                    swipe = 'left';
                else
                    swipe = 'right';
            } 
            else
            {
                if (dotProd < 0.71 && dotProd > -0.71)
                {
                    if (normalized.x < 0.0)
                        swipe = 'left';
                    else
                        swipe = 'right';
                }
            }

            if (swipe)
            {
                if (originalTarget === el)
                {
                    ReUI.DomHelper.bind(el, 'click', touchClick, true);
                }

                ReUI.DomHelper.dispatch(el, 'swipe', {direction: swipe});
            }
        }        
        else if (duration >= minLongClickTime && length <= maxLongClickLength)
        {
            if (originalTarget === el)
            {
                ReUI.DomHelper.bind(el, 'click', touchClick, true);                
                ReUI.DomHelper.dispatch(el, 'clicklong');
            }
        }
    };

    if (!isMobile)
    {    
        root.on('mousedown', touchStart);
        root.on('mouseup', touchEnd);
    } 
    else
    {
        root.on('touchstart', touchStart);
        root.on('touchend', touchEnd);
    }
});
