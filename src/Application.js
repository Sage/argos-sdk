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
    'dojo/has',
    'dojo/string',
    './Utility',
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
    has,
    string,
    utility,
    _Component,
    Scene,
    CustomizationSet
) {

    has.add('tablet-format', Math.max(window.innerHeight, window.innerWidth) > 960);
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

    return declare('Sage.Platform.Mobile.Application', [_Component], {
        _started: false,
        _signals: null,
        _connections: null,
        _modules: null,

        components: [
            {type: Scene, attachPoint: 'scene'},
            {type: CustomizationSet, attachPoint: 'customizations'}
        ],
        customizations: null,
        enableCaching: false,
        context: null,
        scene: null,

        constructor: function(options) {
            this._signals = [];
            this._modules = [];
            this._connections = {};

            this.context = {};

            lang.mixin(this, options);
        },
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
        uninitialize: function() {

        },
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
        _startupConnections: function() {
            for (var name in this.connections)
                if (this.connections.hasOwnProperty(name)) this.registerConnection(name, this.connections[name]);

            /* todo: should we be mixing this in? */
            delete this.connections;
        },
        _startupModules: function() {
            array.forEach(this.modules, function(module) {
                this._modules.push(module);

                module.setApplication(this);
                module.startup();
            }, this);

            /* todo: should we be mixing this in? */
            delete this.modules;
        },
        activate: function() {
            win.global.App = this;
        },
        startup: function() {
            if (this._started) return;

            this.inherited(arguments);

            this._startupEvents();
            this._startupCaching();
            this._startupConnections();
            this._startupModules();
            this._started = true;
        },
        run: function() {

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
        getViewSecurity: function(key, access) {
            return null;
            // todo: implement
            //var view = this.getView(key);
            //return (view && view.getSecurity(access));
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
                    if (predicate.call(scope || this, list[i][k].context))
                        return list[i][k].context;
            }
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

            this.customizations.register(path, spec);
        },
        /**
         * legacy: getCustomizationsFor(set, id);
         * { action: 'remove|modify|insert|replace', at: (index|fn), or: (fn), where: 'before|after', value: {} }
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
