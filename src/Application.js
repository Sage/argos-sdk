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

define('Sage/Platform/Mobile/Application', [
    'dojo/_base/json',
    'dojo/_base/array',
    'dojo/_base/connect',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/window',
    'dojo/string'
], function(
    json,
    array,
    connect,
    declare,
    lang,
    win,
    string
) {
    
    lang.extend(Function, {
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
                if(lang.isObject(localization[key]))
                    applyLocalizationTo(target[key], localization[key]);
                else
                    target[key] = localization[key];
            }
        },
        localize = function(name, localization) {
            var target = lang.getObject(name);
            if (target && target.prototype) target = target.prototype;
            if (target) applyLocalizationTo(target, localization);
        },
        mergeConfiguration = function(baseConfiguration, moduleConfiguration) {
            if (baseConfiguration)
            {
                if (baseConfiguration.modules && moduleConfiguration.modules)
                    baseConfiguration.modules = baseConfiguration.modules.concat(moduleConfiguration.modules);

                if (baseConfiguration.connections && moduleConfiguration.connections)
                    baseConfiguration.connections = lang.mixin(baseConfiguration.connections, moduleConfiguration.connections);
            }

            return baseConfiguration;
        };

    lang.mixin(win.global, {
        'localize': localize,
        'mergeConfiguration': mergeConfiguration
    });
    
    return declare('Sage.Platform.Mobile.Application', null, {
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
        resizeTimer: null,
        constructor: function(options) {
            this._connects = [];
            this._subscribes = [];
            
            this.customizations = {};
            this.services = {};
            this.modules = [];
            this.views = {};
            this.bars = {};

            this.context = {};

            lang.mixin(this, options);
        },
        destroy: function() {
            array.forEach(this._connects, function(handle) {
                connect.disconnect(handle);
            });

            array.forEach(this._subscribes, function(handle){
                connect.unsubscribe(handle);
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
            this._connects.push(connect.connect(window, 'resize', this, this.onResize));
            this._connects.push(connect.connect(win.body(), 'beforetransition', this, this._onBeforeTransition));
            this._connects.push(connect.connect(win.body(), 'aftertransition', this, this._onAfterTransition));
            this._connects.push(connect.connect(win.body(), 'show', this, this._onActivate));
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
                    o.result = json.fromJson(feed);
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
                    window.localStorage.setItem(key, json.toJson(feed));
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

            if ((options.isDefault || service.isDefault) || !this.defaultService)
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

            view.placeAt(win.body(), 'first');

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

            tbar.placeAt(win.body(), 'last');

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
            if (this.resizeTimer) clearTimeout(this.resizeTimer);

            this.resizeTimer = setTimeout(function(){
                connect.publish('/app/resize',[]);
            }, 100);
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
            if (lang.isArray(kind))
                array.forEach(kind, function(item) { this[item] = true;  }, lookup);
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
});