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
 * It is also accessible via an alias at `window.App` (`App`).
 *
 * @alternateClassName App
 * @extends _Component
 * @requires utility
 * @requires scene
 * @requires CustomizationSet
 */
define('argos/Application', [
    'dojo/_base/json',
    'dojo/_base/array',
    'dojo/_base/connect',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/window',
    'dojo/dom-class',
    'dojo/has',
    'dojo/string',
    './utility',
    './_Component',
    './Scene',
    './CustomizationSet'
], function(
    json,
    array,
    connect,
    declare,
    lang,
    win,
    domClass,
    has,
    string,
    utility,
    _Component,
    Scene,
    CustomizationSet
) {

    has.add('retina', window.devicePixelRatio == 2);
    
    lang.extend(Function, {
        bindDelegate: utility.bindDelegate
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

    return declare('argos.Application', [_Component], {
        /**
         * @property {Boolean}
         * Signifies the App has been initialized
         */
        _started: false,
        _signals: null,
        /**
         * @property {Object[]}
         * Array of all connections for App
         */
        _connections: null,
        _modules: null,
        _orientationTimer: null,

        components: [
            {type: Scene, attachPoint: 'scene'},
            {type: CustomizationSet, attachPoint: 'customizations'}
        ],
        customizations: null,
        enableCaching: false,
        context: null,
        scene: null,
        orientation: null,

        /**
         * All options are mixed into App itself
         * @param {Object} options
         */
        constructor: function(options) {
            this._signals = [];
            this._modules = [];
            this._connections = {};

            this.context = {};

            lang.mixin(this, options);
        },
        /**
         * Loops through and disconnects connections and unsubscribes subscriptions.
         * Also calls {@link #uninitialize uninitialize}.
         */
        destroy: function() {
            array.forEach(this._signals, function(signal) {
                signal.remove();
            });

            delete this._signals;

            for (var name in this._connections)
            {
                var connection = this._connections[name];
                if (connection)
                {
                    connection.un('beforerequest', this._loadSDataRequest, this);
                    connection.un('requestcomplete', this._cacheSDataRequest, this);
                }
            }

            this.uninitialize();

            this.inherited(arguments);
        },
        /**
         * Shelled function that is called from {@link #destroy destroy}, may be used to release any further handles.
         */
        uninitialize: function() {

        },
        /**
         * If caching is enable and App is {@link #isOnline online} the empties the SData cache via {@link #_clearSDataRequestCache _clearSDataRequestCache}.
         */
        _startupCaching: function() {
            if (this.enableCaching)
            {
                if (this.isOnline())
                    this._clearSDataRequestCache();
            }
        },
        _startupEvents: function() {
            this._signals.push(connect.connect(window, 'resize', this, this.onResize));
        },
        /**
         * Establishes various connections to events.
         */
        _startupConnections: function() {
            for (var name in this.connections)
                if (this.connections.hasOwnProperty(name)) this.registerConnection(name, this.connections[name]);

            /* todo: should we be mixing this in? */
            delete this.connections;
        },
        /**
         * Loops through modules and calls their `init()` function.
         */
        _startupModules: function() {
            array.forEach(this.modules, function(module) {
                this._modules.push(module);

                module.setApplication(this);
                module.startup();
            }, this);

            /* todo: should we be mixing this in? */
            delete this.modules;
        },
        /**
         * Sets the global variable `App` to this instance.
         */
        activate: function() {
            win.global.App = this;
        },
        /**
         * Initializes this application by calling all the startup functions of Application.
         */
        startup: function() {
            if (this._started) return;

            this.inherited(arguments);

            this._startupEvents();
            this._startupCaching();
            this._startupConnections();
            this._startupModules();

            this._orientationTimer = setTimeout(this._checkOrientation.bindDelegate(this), 50);
            this.isTablet = this.isTabletSized();

            this._started = true;
        },
        run: function() {

        },
        /**
         * Returns if an internet connection is available.
         * @return {Boolean}
         */
        isOnline: function() {
            return window.navigator.onLine;
        },
        _checkOrientation: function() {
            var orientation = (window.innerHeight < window.innerWidth) ? 'landscape' : 'portrait';

            if (orientation !== this.orientation)
            {
                this._setOrientation(orientation, this.isTabletSized());
            }

            this._orientationTimer = setTimeout(this._checkOrientation.bindDelegate(this), 50);
        },
        isTabletSized: function() {
            return Math.max(window.innerHeight, window.innerWidth) >= 960;
        },
        _setOrientation: function(orientation, isTablet) {
            var body = win.body();

            if (this.orientation)
                domClass.remove(body, this.orientation);
            domClass.add(body, orientation);
            this.orientation = orientation;

            this.isTablet = isTablet;
            if (typeof isTablet === 'boolean')
                domClass.toggle(body, 'tablet', isTablet);

            connect.publish('/app/orientation',[{
                orientation: orientation,
                tablet: isTablet
            }]);
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
         * @param {Object} definition May be a SDataService instance or constructor parameters to create a new SDataService instance.
         * @param {Object} options Optional settings for the registered service.
         */
        registerConnection: function(name, definition, options) {
            options = options || {};

            var instance = definition instanceof Sage.SData.Client.SDataService
                ? definition
                : new Sage.SData.Client.SDataService(definition);

            this._connections[name] = instance;

            if (this.enableCaching && (options.offline || definition.offline))
            {
                instance.on('beforerequest', this._loadSDataRequest, this);
                instance.on('requestcomplete', this._cacheSDataRequest, this);
            }

            if ((options.isDefault || definition.isDefault) || !this._connections['default'])
                this._connections['default'] = instance;

            return this;
        },
        /**
         * Determines the the specified service name is found in the Apps service object.
         * @param {String} name Name of the SDataService to detect
         */
        hasConnection: function(name) {
            return !!this._connections[name];
        },
        getConnection: function(name) {
            if (this._connections[name]) return this._connections[name];

            return this._connections['default'];
        },
        /**
         * @deprecated
         * @param name
         * @return {*}
         */
        getView: function(name) {
            if (this._instancedViews[name]) return this._activeViews[name];
            if (this._registeredViews[name])
            {
                return new ViewShim({
                    id: name
                });
            }

            return null;
        },
        /**
         * Returns the defined security for a specific view
         * @param {String} key Id of the registered view to query.
         * @param access
         * @return {Object}
         */
        getViewSecurity: function(key, access) {
            return null;
            // todo: implement
            //var view = this.getView(key);
            //return (view && view.getSecurity(access));
        },
        /**
         * Resize handle, publishes the global event `/app/resize` which views may subscribe to.
         */
        onResize: function() {
            if (this.resizeTimer) clearTimeout(this.resizeTimer);

            var isNowTablet = this.isTabletSized();
            if (isNowTablet !== this.isTablet)
            {
                this.isTablet = isNowTablet;
                domClass.toggle(win.body(), 'tablet', isNowTablet);
            }


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
         * Searches view history state by passing a predicate function that should return true
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

            var list = this.scene._state || [],
                depth = depth || 0;

            for (var i = list.length - 2, j = 0; i >= 0 && (depth <= 0 || j < depth); i--, j++)
            {
                var set = list[i];
                for (var k = 0; k < set.length; k++)
                    if (list[i][k] && predicate.call(scope || this, list[i][k].context))
                        return list[i][k].context;
            }
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

            this.customizations.register(path, spec);
        },
        /**
         * Returns the customizations registered for the provided path.
         *
         * Note: This also accepts the legacy signature:
         * `getCustomizationsFor(set, id)`
         * Where the path is `list/tools` and `id` is the view id
         *
         * @param {String} path The customization set such as `list/tools#account_list` or `detail#contact_detail`. First half being the type of customization and the second the view id.
         * @param specific
         */
        getCustomizationsFor: function(path, specific) {
            /* @deprecated */
            if (arguments.length > 1 && typeof arguments[1] === 'string')
            {
                path = arguments[1]
                    ? arguments[0] + '#' + arguments[1]
                    : arguments[0];
            }

            return this.customizations.get(path, specific);
        },
        hasAccessTo: function(security) {
            return true;
        }
    });
});
