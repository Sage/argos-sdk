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

define('Sage/Platform/Mobile/Application', ['dojo', 'dojo/string'], function() {
    
    dojo.extend(Function, {
        bindDelegate: function(scope) {
            var fn = this;

            if (arguments.length == 1) return function() {
                return fn.apply(scope || this, arguments);
            };

            var optional = Array.prototype.slice.call(arguments, 1);
            return function() {
                var called = Array.prototype.slice.call(arguments, 0);
                return fn.apply(scope || this, called.concat(optional));
            };
        }
    });

    var applyLocalizationTo = function(object, localization) {
            var target = object.prototype || object;
            for(var key in localization)
            {
                if(dojo.isObject(localization[key]))
                    applyLocalizationTo(target[key], localization[key]);
                else
                    target[key] = localization[key];
            }
        },
        localize = function(name, localization) {
            var target = dojo.getObject(name);
            if (target && target.prototype) target = target.prototype;
            if (target) applyLocalizationTo(target, localization);
        },
        mergeConfiguration = function(baseConfiguration, moduleConfiguration) {
            if (baseConfiguration)
            {
                if (baseConfiguration.modules && moduleConfiguration.modules)
                    baseConfiguration.modules = baseConfiguration.modules.concat(moduleConfiguration.modules);

                if (baseConfiguration.connections && moduleConfiguration.connections)
                    baseConfiguration.connections = dojo.mixin(baseConfiguration.connections, moduleConfiguration.connections);
            }

            return baseConfiguration;
        };

    dojo.mixin(dojo.global, {
        'localize': localize,
        'mergeConfiguration': mergeConfiguration
    });
    
    return dojo.declare('Sage.Platform.Mobile.Application', null, {
        _connects: null,
        _subscribes: null,
        _started: false,
        customizations: null,
        services: null,
        modules: null,
        views: null,
        bars: null,
        enableCaching: false,
        defaultService: null,
        constructor: function(options) {
            this._connects = [];
            this._subscribes = [];
            
            this.customizations = {};
            this.services = {};
            this.modules = [];
            this.views = {};
            this.bars = {};

            this.context = {};

            dojo.mixin(this, options);
        },
        destroy: function() {
            dojo.forEach(this._connects, function(handle) {
                dojo.disconnect(handle);
            });

            dojo.forEach(this._subscribes, function(handle){
                dojo.unsubscribe(handle);
            });

            this.uninitialize();
        },
        uninitialize: function() {

        },
        initReUI: function() {
            // prevent ReUI from attempting to load the URLs view as we handle that ourselves.
            // todo: add support for handling the URL?
            window.location.hash = '';

            ReUI.init();
        },
        initCaching: function() {
            if (this.enableCaching)
            {
                if (this.isOnline())
                    this._clearSDataRequestCache();
            }
        },
        initConnects: function() {
            this._connects.push(dojo.connect(window, 'resize', this, this.onResize));
            this._connects.push(dojo.connect(dojo.body(), 'beforetransition', this, this._onBeforeTransition));
            this._connects.push(dojo.connect(dojo.body(), 'aftertransition', this, this._onAfterTransition));
            this._connects.push(dojo.connect(dojo.body(), 'show', this, this._onActivate));
        },
        initServices: function() {
            for (var name in this.connections) this.registerService(name, this.connections[name]);
        },
        initModules: function() {
            for (var i = 0; i < this.modules.length; i++)
                this.modules[i].init(this);
        },
        initViews: function() {
            for (var n in this.views) this.views[n].init(); // todo: change to startup
        },
        initToolbars: function() {
            for (var n in this.bars) this.bars[n].init(); // todo: change to startup
        },
        activate: function() {
            window.App = this;
        },
        init: function() {
            /// <summary>
            ///     Initializes this application as well as the toolbar and all currently registered views.
            /// </summary>
            this.initConnects();
            this.initCaching();
            this.initServices();
            this.initModules();
            this.initToolbars();
            this.initViews();
            this.initReUI();
        },
        run: function() {
            this._started = true;
        },
        isOnline: function() {
            return window.navigator.onLine;
        },
        _clearSDataRequestCache: function() {
            var check = function(k) {
                return /^sdata\.cache/i.test(k);
            };

            if (window.localStorage)
            {
                /* todo: find a better way to detect */
                for (var i = window.localStorage.length - 1; i >= 0 ; i--)
                {
                    var key = window.localStorage.key(i);
                    if (check(key))
                        window.localStorage.removeItem(key);
                }
            }
        },
        _createCacheKey: function(request) {
            return 'sdata.cache[' + request.build() + ']';
        },
        _loadSDataRequest: function(request, o) {
            /// <param name="request" type="Sage.SData.Client.SDataBaseRequest" />
            // todo: find a better way of indicating that a request can prefer cache
            if (window.localStorage)
            {
                if (this.isOnline() && (request.allowCacheUse !== true)) return;

                var key = this._createCacheKey(request);
                var feed = window.localStorage.getItem(key);
                if (feed)
                {
                    o.result = dojo.fromJson(feed);
                }
            }
        },
        _cacheSDataRequest: function(request, o, feed) {
            /* todo: decide how to handle PUT/POST/DELETE */
            if (window.localStorage)
            {
                if (/get/i.test(o.method) && typeof feed === 'object')
                {
                    var key = this._createCacheKey(request);

                    window.localStorage.removeItem(key);
                    window.localStorage.setItem(key, dojo.toJson(feed));
                }
            }
        },
        registerService: function(name, service, options) {
            options = options || {};

            var instance = service instanceof Sage.SData.Client.SDataService
                ? service
                : new Sage.SData.Client.SDataService(service);

            this.services[name] = instance;

            if (this.enableCaching && (options.offline || service.offline))
            {
                instance.on('beforerequest', this._loadSDataRequest, this);
                instance.on('requestcomplete', this._cacheSDataRequest, this);
            }

            if ((options.isDefault || instance.isDefault) || !this.defaultService)
                this.defaultService = instance;

            return this;
        },
        hasService: function(name) {
            return !!this.services[name];
        },
        registerView: function(view) {
            /// <summary>
            ///     Registers a view with the application.  If the application has already been
            ///     initialized, the view is immediately initialized as well.
            /// </summary>
            /// <param name="view" type="Sage.Platform.Mobile.View">The view to be registered.</param>
            this.views[view.id] = view;

            if (this._started) view.init();

            view.placeAt(dojo.body(), 'first');

            this.onRegistered(view);

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

            if (this._started) tbar.init();

            tbar.placeAt(dojo.body(), 'last');

            return this;
        },
        getViews: function() {
            /// <returns elementType="Sage.Platform.Mobile.View">An array containing the currently registered views.</returns>
            var r = [];
            for (var n in this.views) r.push(this.views[n]);
            return r;
        },
        isViewActive: function(view) {
            // todo: add check for multiple active views.
            return (this.getPrimaryActiveView() === view);
        },
        getPrimaryActiveView: function() {
            /// <returns type="Sage.Platform.Mobile.View">The currently active view.</returns>
            var el = ReUI.getCurrentPage() || ReUI.getCurrentDialog();
            if (el) return this.getView(el);

            return null;
        },
        hasView: function(key) {
            return !!this.getView(key);
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
        getViewSecurity: function(key, access) {
            var view = this.getView(key);
            return (view && view.getSecurity(access));
        },
        getService: function(name) {
            /// <returns type="Sage.SData.Client.SDataService">The application's SData service instance.</returns>
            if (typeof name === 'string' && this.services[name])
                return this.services[name];

            return this.defaultService;
        },
        setPrimaryTitle: function(title) {
            /// <summary>Sets the applications current title.</summary>
            /// <param name="title" type="String">The new title.</summary>
            for (var n in this.bars)
                if (this.bars[n].managed) this.bars[n].set('title', title);
        },
        onResize: function() {
        },
        onRefresh: function(options) {
        },
        onRegistered: function(view) {
        },
        onBeforeViewTransitionAway: function(view) {
        },
        onBeforeViewTransitionTo: function(view) {
        },
        onViewTransitionAway: function(view) {
        },
        onViewTransitionTo: function(view) {
        },
        onViewActivate: function(view, tag, data) {
        },
        _onBeforeTransition: function(evt) {
            var view = this.getView(evt.target);
            if (view)
            {
                if (evt.out)
                    this._beforeViewTransitionAway(view);
                else
                    this._beforeViewTransitionTo(view);
            }
        },
        _onAfterTransition: function(evt) {
            var view = this.getView(evt.target);
            if (view)
            {
                if (evt.out)
                    this._viewTransitionAway(view);
                else
                    this._viewTransitionTo(view);
            }
        },
        _onActivate: function(evt) {
            var view = this.getView(evt.target);
            if (view) this._viewActivate(view, evt.tag, evt.data);
        },
        _beforeViewTransitionAway: function(view) {
            this.onBeforeViewTransitionAway(view);

            view.beforeTransitionAway();
        },
        _beforeViewTransitionTo: function(view) {
            this.onBeforeViewTransitionTo(view);

            for (var n in this.bars)
                if (this.bars[n].managed)
                    this.bars[n].clear();

            view.beforeTransitionTo();
        },
        _viewTransitionAway: function(view) {
            this.onViewTransitionAway(view);

            view.transitionAway();
        },
        _viewTransitionTo: function(view) {
            this.onViewTransitionTo(view);

            var tools = (view.options && view.options.tools) || view.getTools() || {};

            for (var n in this.bars)
                if (this.bars[n].managed)
                    this.bars[n].showTools(tools[n]);

            view.transitionTo();
        },
        _viewActivate: function(view, tag, data) {
            this.onViewActivate(view);

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
        },
        isNavigationFromResourceKind: function(kind, predicate, scope) {
            var lookup = {};
            if (dojo.isArray(kind))
                dojo.forEach(kind, function(item) { this[item] = true;  }, lookup);
            else
                lookup[kind] = true;

            return this.queryNavigationContext(function(o) {
                var context = (o.options && o.options.source) || o,
                    resourceKind = context && context.resourceKind;

                // if a predicate is defined, both resourceKind AND predicate must match.
                if (lookup[resourceKind]) {
                    if (predicate) {
                        if (predicate.call(scope || this, o, context)) return o;
                    }
                    else
                        return o;
                }
            });
        },
        /**
         * legacy: registerCustomization(set, id, spec);
         */
        registerCustomization: function(path, spec) {
            if (arguments.length > 2)
            {
                var customizationSet = arguments[0],
                    id = arguments[1];

                spec = arguments[2];
                path = id
                    ? customizationSet + '#' + id
                    : customizationSet;
            }
            
            var container = this.customizations[path] || (this.customizations[path] = []);
            if (container) container.push(spec);
        },
        /**
         * legacy: getCustomizationsFor(set, id);
         * { action: 'remove|modify|insert|replace', at: (index|fn), or: (fn), where: 'before|after', value: {} }
         */
        getCustomizationsFor: function(path) {
            if (arguments.length > 1)
            {
                path = arguments[1]
                    ? arguments[0] + '#' + arguments[1]
                    : arguments[0];
            }

            var segments = path.split('#'),
                customizationSet = segments[0];

            var forPath = this.customizations[path] || [],
                forSet = this.customizations[customizationSet] || [];

            return forPath.concat(forSet);
        },
        hasAccessTo: function(security) {
            return true;
        }
    });

    /* todo: convert swipe */
    /* todo: move to top */
    /*
    Ext.onReady(function(){
        var isApple = /(iphone|ipad|ipod)/i.test(navigator.userAgent),
            isMobile = (typeof window.orientation !== 'undefined'),
            rootEl = Ext.get(document.documentElement),
            onlyHorizontalSwipe = true,
            minSwipeLength = 100.0,
            maxSwipeTime = 0.5,
            minLongPressTime = 1.5,
            maxLongPressLength = 5.0,
            preventOther = false,
            preventClick = false,
            startEl = null,
            startAt = null,
            startTime = null,
            longPressTimer = null;

        // states =>

        var stopEvent = function(evt) {
            if (evt.preventBubble) evt.preventBubble();
            if (evt.preventDefault) evt.preventDefault();
            if (evt.stopPropagation) evt.stopPropagation();
            if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();

            return false;
        };

        var onRootClickCapture = function(evt) {
            if (preventClick)
            {
                preventClick = false;
                return stopEvent(evt);
            }
        };

        var onLongPress = function() {
            ReUI.DomHelper.dispatch(startEl, 'longpress');

            stopTouchTracking();

            preventOther = true;
        };

        var onTouchStart = function(evt, el) {
            if (evt.browserEvent && evt.browserEvent.button == 2) return;

            var touch = evt.browserEvent.touches && evt.browserEvent.touches[0];

            startEl = el;
            startAt = touch ? [touch.pageX, touch.pageY] : evt.getXY();
            startTime = (new Date()).getTime();

            rootEl.on(isMobile ? 'touchmove' : 'mousemove', onTouchMove);

            longPressTimer = setTimeout(onLongPress, (minLongPressTime * 1000));

            //return stopEvent(evt);
        };

        var stopTouchTracking = function() {
            clearTimeout(longPressTimer);

            longPressTimer = null;

            rootEl.un(isMobile ? 'touchmove' : 'mousemove', onTouchMove);
        };

        // only occurs when the touch lifecycle is cancelled (by the browser).
        var onTouchCancel = function() {
            stopTouchTracking();
            preventClick = false,
            preventOther = false;
        };

        var onTouchMove = function(evt, el) {
            var touch = evt.browserEvent.touches && evt.browserEvent.touches[0],
                at = touch ? [touch.pageX, touch.pageY] : evt.getXY(),
                direction = {x: at[0] - startAt[0], y: at[1] - startAt[1]},
                length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);

            if (length > maxLongPressLength)
            {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };

        var onTouchEnd = function(evt, el) {
            if (evt.browserEvent && evt.browserEvent.button == 2) return;

            if (preventOther)
            {
                if (el == startEl)
                    preventClick = true;

                onTouchCancel();
                return;
            }

            var touch = evt.browserEvent.changedTouches && evt.browserEvent.changedTouches[evt.browserEvent.changedTouches.length-1],
                endAt = touch ? [touch.pageX, touch.pageY] : evt.getXY(),
                endTime = (new Date()).getTime(),
                duration = (endTime - startTime) / 1000.0,
                direction = {
                    x: endAt[0] - startAt[0],
                    y: endAt[1] - startAt[1]
                },
                length = Math.sqrt(direction.x * direction.x + direction.y * direction.y),
                normalized = {
                    x: direction.x / length,
                    y: direction.y / length
                },
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
                    if (el == startEl)
                        preventClick = true;

                    ReUI.DomHelper.dispatch(startEl, 'swipe', {direction: swipe});
                }
            }

            // clean-up
            onTouchCancel();
        };

        rootEl.on(isMobile ? 'touchstart' : 'mousedown', onTouchStart);
        rootEl.on(isMobile ? 'touchend' : 'mouseup', onTouchEnd);

        ReUI.DomHelper.bind(rootEl.dom, 'click', onRootClickCapture, true);
    });
    */
});