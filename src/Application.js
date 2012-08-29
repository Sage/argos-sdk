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

/**
 * Application is a nexus that provides many routing and global application services that may be used
 * from anywhere within the app.
 *
 * It provides a shortcut alias to `window.App` (`App`) with the most common usage being `App.getView(id)`.
 *
 * @alternateClassName App
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

            if (arguments.length == 1) return function()
            {
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
            for (var key in localization)
            {
                if (lang.isObject(localization[key]))
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
        /**
         * Array of all connections for App
         * @property {Object[]}
         */
        _connects: null,
        /**
         * Array of all subscriptions for App
         */
        _subscribes: null,
        /**
         * Signifies the App has been initialized
         * @property {Boolean}
         */
        _started: false,
        customizations: null,
        services: null,
        modules: null,
        views: null,
        /**
         * Toolbar instances by key name
         * @property {Object}
         */
        bars: null,
        enableCaching: false,
        /**
         * The default Sage.SData.Client.SDataService instance
         * @property {Object}
         */
        defaultService: null,
        resizeTimer: null,
        /**
         * All options are mixed into App itself
         * @param {Object} options
         */
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
        /**
         * Loops through and disconnections connections and unsubscribes subscriptions.
         * Also calls {@link #uninitialize uninitialize}.
         */
        destroy: function() {
            array.forEach(this._connects, function(handle) {
                connect.disconnect(handle);
            });

            array.forEach(this._subscribes, function(handle){
                connect.unsubscribe(handle);
            });

            this.uninitialize();
        },
        /**
         * Shelled function that is called from {@link #destroy destroy}, may be used to release any further handles.
         */
        uninitialize: function() {

        },
        /**
         * Cleans up URL to prevent ReUI url handling and then invokes ReUI.
         */
        initReUI: function() {
            // prevent ReUI from attempting to load the URLs view as we handle that ourselves.
            // todo: add support for handling the URL?
            window.location.hash = '';

            ReUI.init();
        },
        /**
         * If caching is enable and App is {@link #isOnline online} the empties the SData cache via {@link #_clearSDataRequestCache _clearSDataRequestCache}.
         */
        initCaching: function() {
            if (this.enableCaching)
            {
                if (this.isOnline())
                    this._clearSDataRequestCache();
            }
        },
        /**
         * Establishes various connections to events.
         */
        initConnects: function() {
            this._connects.push(connect.connect(window, 'resize', this, this.onResize));
            this._connects.push(connect.connect(win.body(), 'beforetransition', this, this._onBeforeTransition));
            this._connects.push(connect.connect(win.body(), 'aftertransition', this, this._onAfterTransition));
            this._connects.push(connect.connect(win.body(), 'show', this, this._onActivate));
        },
        /**
         * Loops through connections and calls {@link #registerService registerService} on each.
         */
        initServices: function() {
            for (var name in this.connections)
                this.registerService(name, this.connections[name]);
        },
        /**
         * Loops through modules and calls their `init()` function.
         */
        initModules: function() {
            for (var i = 0; i < this.modules.length; i++)
                this.modules[i].init(this);
        },
        /**
         * Loops through views and calls their `init()` function.
         */
        initViews: function() {
            for (var n in this.views)
                this.views[n].init(); // todo: change to startup
        },
        /**
         * Loops through (tool)bars and calls their `init()` function.
         */
        initToolbars: function() {
            for (var n in this.bars)
                this.bars[n].init(); // todo: change to startup
        },
        /**
         * Sets the global variable `App` to this instance.
         */
        activate: function() {
            window.App = this;
        },
        /**
         * Initializes this application as well as the toolbar and all currently registered views.
         */
        init: function() {
            this.initConnects();
            this.initCaching();
            this.initServices();
            this.initModules();
            this.initToolbars();
            this.initViews();
            this.initReUI();
        },
        /**
         * Sets `_started` to true.
         */
        run: function() {
            this._started = true;
        },
        /**
         * Returns the `window.navigator.onLine` property for detecting if an internet connection is available.
         */
        isOnline: function() {
            return window.navigator.onLine;
        },
        /**
         * Removes all keys from localStorage that start with `sdata.cache`.
         */
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
        /**
         * Creates a cache key based on the URL of the request
         * @param {Object} request Sage.SData.Client.SDataBaseRequest
         * @return {String} Key to be used for localStorage cache
         */
        _createCacheKey: function(request) {
            return 'sdata.cache[' + request.build() + ']';
        },
        /**
         * If the app is {@link #isOnline offline} and cache is allowed this function will attempt to load the passed
         * request from localStorage by {@link #_createCacheKey creating} a key from the requested URL.
         * @param request Sage.SData.Client.SDataBaseRequest
         * @param o XHR object with namely the `result` property
         */
        _loadSDataRequest: function(request, o) {
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
        /**
         * Attempts to store all GET request results into localStorage
         * @param request SData request
         * @param o XHR object
         * @param feed The data from the request to store
         */
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
        /**
         * Optional creates, then registers an Sage.SData.Client.SDataService and adds the result to `App.services`.
         * @param {String} name Unique identifier for the service.
         * @param {Object} service May be a SDataService instance or constructor parameters to create a new SDataService instance.
         * @param {Object} options Optional settings for the registered service.
         */
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
        /**
         * Determines the the specified service name is found in the Apps service object.
         * @param {String} name Name of the SDataService to detect
         */
        hasService: function(name) {
            return !!this.services[name];
        },
        /**
         * Registers a view with the application and renders it to HTML.
         * If the application has already been initialized, the view is immediately initialized as well.
         * @param {View} view A view instance to be registered.
         */
        registerView: function(view) {
            this.views[view.id] = view;

            if (this._started) view.init();

            view.placeAt(win.body(), 'first');

            this.onRegistered(view);

            return this;
        },
        /**
         * Registers a toolbar with the application and renders it to HTML.
         * If the application has already been initialized, the toolbar is immediately initialized as well.
         * @param {String} name Unique name of the toolbar
         * @param {Toolbar} tbar Toolbar instance to register
         */
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
        /**
         * Returns all the registered views.
         * @return {View[]} An array containing the currently registered views.
         */
        getViews: function() {
            var r = [];
            for (var n in this.views) r.push(this.views[n]);
            return r;
        },
        /**
         * Checks to see if the passed view instance is the currently active one by comparing it to {@link #getPrimaryActiveView primaryActiveView}.
         * @param {View} view
         * @return {Boolean} True if the passed view is the same as the active view.
         */
        isViewActive: function(view) {
            // todo: add check for multiple active views.
            return (this.getPrimaryActiveView() === view);
        },
        /**
         * Talks to ReUI to get the current page or dialog name and then returns the result of {@link #getView getView(name)}.
         * @return {View} Returns the active view instance, if no view is active returns null.
         */
        getPrimaryActiveView: function() {
            var el = ReUI.getCurrentPage() || ReUI.getCurrentDialog();
            if (el) return this.getView(el);

            return null;
        },
        /**
         * Determines if any registered view has been registered with the provided key.
         * @param {String} key Unique id of the view.
         * @return {Boolean} True if there is a registered view name matching the key.
         */
        hasView: function(key) {
            return !!this.getView(key);
        },
        /**
         * Returns the registered view instance with the associated key.
         * @param {String/Object} key The id of the view to return, if object then `key.id` is used.
         * @return {View} view The requested view.
         */
        getView: function(key) {
            if (key)
            {
                if (typeof key === 'string')
                    return this.views[key];

                if (typeof key === 'object' && typeof key.id === 'string')
                    return this.views[key.id];
            }
            return null;
        },
        /**
         * Returns the defined security for a specific view
         * @param {String} key Id of the registered view to query.
         * @param access
         */
        getViewSecurity: function(key, access) {
            var view = this.getView(key);
            return (view && view.getSecurity(access));
        },
        /**
         * Returns the registered SDataService instance by name, or returns the default service.
         * @param {String/Boolean} name If string service is looked up by name. If false, default service is returned.
         * @return {Object} The registered Sage.SData.Client.SDataService instance.
         */
        getService: function(name) {
            if (typeof name === 'string' && this.services[name])
                return this.services[name];

            return this.defaultService;
        },
        /**
         * Sets the applications current title.
         * @param {String} title The new title.
         */
        setPrimaryTitle: function(title) {
            for (var n in this.bars)
                if (this.bars[n].managed) this.bars[n].set('title', title);
        },
        /**
         * Resize handle, publishes the global event `/app/resize` which views may subscribe to.
         */
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
            if (view)
                this._viewActivate(view, evt.tag, evt.data);
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
        /**
         * Searches ReUI.context.history by passing a predicate function that should return true
         * when a match is found.
         * @param {Function} predicate Function that is called in the provided scope with the current history iteration. It should return true if the history item is the desired context.
         * @param {Number} depth
         * @param {Object} scope
         * @return {Object/Boolean} context History data context if found, false if not.
         */
        queryNavigationContext: function(predicate, depth, scope) {
            if (typeof depth !== 'number')
            {
                scope = depth;
                depth = 0;
            }

            var list = ReUI.context.history || [],
                depth = depth || 0;

            for (var i = list.length - 2, j = 0; i >= 0 && (depth <= 0 || j < depth); i--, j++)
                if (predicate.call(scope || this, list[i].data))
                    return list[i].data;

            return false;
        },
        /**
         * Shortcut method to {@link #queryNavigationContext queryNavigationContext} that matches the specified resourceKind provided
         * @param {String/String[]} kind The resourceKind(s) the history item must match
         * @param {Function} predicate Optional. If provided it will be called on matches so you may do an secondary check of the item - returning true for good items.
         * @param {Object} scope Scope the predicate should be called in.
         * @return {Object} context History data context if found, false if not.
         */
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
                if (lookup[resourceKind])
                {
                    if (predicate)
                    {
                        if (predicate.call(scope || this, o, context)) return o;
                    }
                    else
                        return o;
                }
            });
        },
        /**
         * Registers a customization to a target path.
         *
         * A Customization Spec is a special object with the following keys:
         *
         * * `at`: `function(item)` - passes the current item in the list, the function should return true if this is the item being modified (or is at where you want to insert something).
         * * `at`: `{Number}` - May optionally define the index of the item instead of a function.
         * * `type`: `{String}` - enum of `insert`, `modify`, `replace` or `remove` that indicates the type of customization.
         * * `where`: `{String}` - enum of `before` or `after` only needed when type is `insert`.
         * * `value`: `{Object}` - the entire object to create (insert or replace) or the values to overwrite (modify), not needed for remove.
         * * `value`: `{Object[]}` - if inserting you may pass an array of items to create.
         *
         * Note: This also accepts the legacy signature:
         * `registerCustomization(path, id, spec)`
         * Where the path is `list/tools` and `id` is the view id
         *
         * All customizations are registered to `this.customizations[path]`.
         *
         * @param {String} path The customization set such as `list/tools#account_list` or `detail#contact_detail`. First half being the type of customization and the second the view id.
         * @param {Object} spec The customization specification
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
         * Returns the customizations registered for the provided path.
         *
         * Note: This also accepts the legacy signature:
         * `getCustomizationsFor(set, id)`
         * Where the path is `list/tools` and `id` is the view id
         *
         * @param {String} path The customization set such as `list/tools#account_list` or `detail#contact_detail`. First half being the type of customization and the second the view id.
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