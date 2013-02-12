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
 * Scene is the mastermind controller of the layout. It handles registration, showing, accessing and state history of
 * views.
 *
 * Note, when you require scene, you should do it in this manner:
 *
 *     define('myClass', ['argos!scene'], function(scene), {
 *         myFunction: function() {
 *             scene().showView('view_id'); // note scene()
 *         }
 *     });
 *
 * The more notable public functions of Scene are: registerView, showView, getView and back.
 *
 * @alternateClassName scene
 * @extends _Component
 * @requires Layout
 * @requires View
 */
define('argos/Scene', [
    'require',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/json',
    'dojo/_base/window',
    'dojo/topic',
    './_Component',
    './Layout',
    './View'
], function(
    require,
    array,
    declare,
    lang,
    json,
    win,
    topic,
    _Component,
    Layout,
    View
) {
    /*
     in order to expand or contract the number of tiers, state must be re-linearized, and browser history must be re-written.

     to re-write browser history: browser back # of state sets in the old state
     to re-linearize state down:
        - beginning with the lowest-priority tier (N), trace tier N-1 back until change
            - (A, B) => (A, C) => (A, D) ==> (A, D) : N-1 is A, so N-1 can be traced back until (A, B)
            - (A, 0) => (B, 0) => (B, C) => (B, D) ===> (B, 0) : N-1 is B, so N-1 can be traced back until (B, 0)
        - linearize to start with N-1 value, then build back N
            - (A, 0) => (B, 0) => (B, C) => (B, D)
                        (B, 0) => (B, C) => (B, D)
                     => (B) => (0) => (C) => (D)
                     => (B) => (C) => (D)
        - a shortcut may be to trace back to where N is 0.

     to re-linearize state up:
        - track the original tier each item in the state set was shown with
        - simply play-forward the standard algorithm, with the correct tier
     */
    return declare('argos.Scene', [_Component], {
        _registeredViews: null,
        _instancedViews: null,
        _signals: null,
        _state: null,
        /**
         * A queue of view instances waiting to be shown (after async operations).
         */
        _queue: null,
        /**
         * True if the scene is currently idle.  False if a view is in the process of being shown.
         */
        _idle: true,
        /**
         * A hash containing information about which views are waiting for other views to be shown.
         *
         * key (the view waiting) => value (the view being waited for)
         */
        _wait: null,
        /**
         * If truthy, the last view that was required.
         */
        _last: null,
        _initialState: null,
        _currentHash: null,
        timer: null,
        _timerRefresh: 100,
        components: [
            {type: Layout, attachPoint: 'layout'}
        ],
        layout: null,

        constructor: function(options) {
            this._registeredViews = {};
            this._instancedViews = {};

            this._signals = [];
            this._state = [];
            this._queue = [];
            this._wait = {};
            this._idle = true;

            lang.mixin(this, options);
        },
        dumpState: function() {
            var count = this._state.length,
                output = [];

            for (var position = 0; position < count; position++)
            {
                var stateSet = this._state[position],
                    tuple = [];

                for (var i = 0; i < stateSet.length; i++) tuple.push(stateSet[i].hash);

                output.push('(' + tuple.join(', ') + ')');
            }

            console.log(output.join(' => '));
        },
        _saveState: function() {
            try
            {
                if (window.localStorage)
                    window.localStorage.setItem('argos-navigationState', json.toJson(this._state));
            }
            catch(e) { }

                this._currentHash = location.hash = (this._state.length - 1);
        },
        _getSavedState: function() {
            try
            {
                if (window.localStorage)
                {
                    return window.localStorage.getItem('argos-navigationState') || this._state;
                }
            }
            catch (e) { }

            return [];
        },
        loadInitialState: function() {
            var state = json.fromJson(this._initialState),
                sets = state.length;

            if (sets > 0)
                this._restoreFromState(state);
        },
        clearSavedState: function() {
            try
            {
                if (window.localStorage)
                    window.localStorage.removeItem('argos-navigationState');
            }
            catch (e) { }

            this._initialState = [];
        },
        _checkHash: function() {
            var setIndex = parseInt(location.hash.substring(1), 10);

            if (this._idle)
            {
                if (setIndex != this._currentHash && !isNaN(setIndex) && setIndex < this._state.length)
                {
                    var stateSet = this._state[setIndex];
                    this._loadStateSet(stateSet, this._createViewSet(this._state[setIndex], {}));
                }
            }
            this.timer = setTimeout(this._checkHash.bindDelegate(this), this._timerRefresh)
        },
        onStartup: function() {
            this.inherited(arguments);

            this._signals.push(topic.subscribe('/app/scene/back', lang.hitch(this, this.back)));

            this.layout.placeAt(win.body());

            this._initialState = this._getSavedState();

            this.timer = setTimeout(this._checkHash.bindDelegate(this), this._timerRefresh);
        },
        onDestroy: function() {
            this.inherited(arguments);

            array.forEach(this._signals, function(signal) {
                signal.remove();
            });

            delete this._signals;

            for (var name in this._instancedViews)
            {
                this._instancedViews[name].destroy();
            }

            this._registeredViews = null;
            this._instancedViews = null;

            this._state = null;
        },

        /**
         * Registers multiple views from a given key/value hash
         * @param {Object} definitions Key/value hash where the key is the unique view name and hash is the views component definition.
         */
        registerViews: function(definitions) {
            for (var name in definitions)
            {
                this.registerView(name, definitions[name]);
            }
        },

        /**
         * Registers a view with the given unique name and the provided component definition/view instance.
         * @param {String} name Required unique name.
         * @param {Object} definition The component definition of the view. If instead it is a view instance the
         * instanced view will be directly added to `_instancedViews`.
         */
        registerView: function(name, definition) {
            if (definition instanceof View)
            {
                this._instancedViews[name] = definition;
            }
            else
            {
                this._registeredViews[name] = definition;
            }

            /* todo: how to handle home screen support? */

            return this;
        },

        /**
         * Determines if the given named view is registered or instanced.
         * @param {String} name Unique identifier of the view to search for
         * @return {Boolean} True/false if the view has been registered.
         */
        hasView: function(name) {
            return !!(this._instancedViews[name] || this._registeredViews[name]);
        },

        /**
         * Returns the component definition of the given named view.
         * @param {String} name Unique identifier of the view to get the definition
         * @return {Object} The component definition used to register the view
         */
        getViewRegistration: function(name) {
            return this._registeredViews[name];
        },

        /* todo: add a method, restoreView(name), to restore a view to the most recent point in _state. will not show, only restore. */
        restoreView: function(name) {
        },

        /**
         * Starts the show process of a view.
         *
         * Examples:
         *
         *     // no options, defaults to tier that account_list defines
         *     scene().showView('account_list');
         *
         *     // passes optional info to the view which may then be parsed and reacted to
         *     scene().showView('calendar_daylist', {currentDate: new Date().getTime()});
         *
         *     // shows the view into the dialog Pane instead of determining by tier
         *     scene().showView('login', null, 'dialog');
         *
         *     // alters how history is returned
         *     scene().showView('note_edit', {insert: true}, null, {returnTo: -1});
         *
         * @param {String} name Unique name of the view to show, the name is the one the view was registered with.
         * @param {Object?} options Optional. Object that contains the options the view being shown will recieve.
         * @param {String?} at Optional. The name of the Pane to show the view, by default it will use the tier system.
         * @param {Object?} navigation Optional. Transition/nav options that Scene/Layout/Pane may use to change the default navigations.
         */
        showView: function(name, options, at, navigation) {
            /* todo: this should return a deferred */
            /* todo: add a fix for when the same view is shown multiple times before completion, i.e. multiple click on initial show, due to lag */

            var instance = this._instancedViews[name];
            if (instance)
            {
                /* since the view has already been required and instantiated, if the scene is idle, it can be shown immediately. */
                /* otherwise, it needs to be placed on the queue */
                if (this._idle)
                {
                    this._showViewInstance(name, instance, options, at, navigation);
                }
                else
                {
                    this._queue.push([name, instance, options, at, navigation]);
                }

                return;
            }

            var definition = this._registeredViews[name];
            if (definition)
            {

                /* if _last has been set, another view is in the process of being shown, this view needs to wait for that one. */
                /* the view can be required, and instantiated, while that is happening. */
                if (this._last)
                {
                    console.log('%s is waiting for %s', name, this._last);

                    this._wait[name] = this._last;
                }

                console.log('last is now %s', name);

                this._last = name;

                /* todo: figure out why a `setTimeout` is required here */
                /* if `require` is called within a `require` as part of `dojo/domReady!`, the
                   page `load` event will not fire. */
                setTimeout(lang.hitch(this, this._loadView, name, options, definition, at, navigation), 0);
            }
        },
        _isEquivalentStateSet: function(a, b) {
            if (a.length != b.length) return false;

            for (var i = 0; i < a.length; i++)
            {
                if (a[i] && !b[i]) return false;
                if (b[i] && !a[i]) return false;

                if (a[i] && b[i] && a[i].hash != b[i].hash) return false;
            }

            return true;
        },
        _trimStateTo: function(stateSet, navigation) {
            var count = this._state.length,
                position = -1;

            for (position = count - 1; position >= 0; position--)
            {
                if (this._isEquivalentStateSet(this._state[position], stateSet)) break;
            }

            if (position > -1)
            {
                /* todo: sync browser history state */
                /* previously, we flagged as `trimmed` and state was fixed later */
                /* trimmed == true => new view pushed */

                console.log('found trim state at %d', position);
                this._state.splice(position, count - position);

                /* todo: persist new state */
                history.go(position - this._state.length - 1);
            }
            else if (navigation && typeof navigation.returnTo !== 'undefined')
            {
                console.log('processing returnTo');

                if (typeof navigation.returnTo === 'function')
                {
                    for (position = count - 1; position >= 0; position--)
                        if (navigation.returnTo(this._state[position]))
                            break;
                }
                else if (navigation.returnTo < 0)
                {
                    position = (count) + navigation.returnTo;
                }

                if (position > -1)
                {
                    /* todo: sync browser history state */
                    /* previously, we flagged as NOT `trimmed` and state was fixed later. */
                    /* trimmed == false => new view not pushed */

                    console.log('finalized returnTo at %d', position);
                    this._state.splice(position, count - position);
                    history.go(position - this._state.length - 1);
                }
            }
        },
        _createStateSet: function(view, location) {
            var context = view.getContext(),
                tag = view.getTag(),
                hash = [view.id].concat(tag ? tag : []).join(';'),
                stateSet = [],
                stateMark = this._state.length - 1,
                tiers = this.layout.tiers,
                target = Math.min(tiers - 1, location.tier);

            /* todo: add position adjustment */
            /* todo: add pane maximization */
            for (var tier = 0; tier < tiers; tier++)
            {
                /* inherit the state of the higher priority tiers */
                stateSet[tier] = this._state[stateMark] && tier < location.tier ? this._state[stateMark][tier] : null;
            }

            stateSet[target] = { hash: hash, context: context, location: location };

            return stateSet;
        },
        _createViewSet: function(stateSet, navigation) {
            var viewSet = [],
                count = this._state.length;

            for (var i = 0; i < stateSet.length; i++)
            {
                var entry = stateSet[i],
                    context = entry && entry.context;

                /* todo: add information for how to transition based on how navigation is happening */
                /* i.e. forward => queue tier 0 ... n
                        backward => queue tier n ... 0

                        with: list => list, detail (detail panel should slide in L to R)
                              list, detail => list (detail panel should pop out) */
                if (context)
                    viewSet.push({
                        view: this._instancedViews[context.view],
                        initial: count == 0,
                        primary: navigation.primary == context.view,
                        reverse: navigation.reverse,
                        always: navigation.always
                    });
                else
                    viewSet.push({empty: true});
            }

            return viewSet;
        },
        _showViewInstance: function(name, view, options, at, navigation) {
            this._idle = false;

            /* we are no longer idle and can remove the instance from the require wait list */
            console.log('removing waits for %s', name);

            for (var search in this._wait)
            {
                if (this._wait[search] == name) delete this._wait[search];
            }

            /* the instance is the last require, can clear out the flag */
            if (this._last === name)
            {
                console.log('removing last for %s', name);

                this._last = false;
            }

            var location,
                deferred;

            if (typeof at === 'string')
            {
                /* todo: remember the last view shown? */
                /* the location is not a tracked pane, simply show the view */
                if (this.layout.panes[at].tier === false)
                {
                    view.activate(options); /* activation required in order to build context (i.e. hash, etc.) */
                    deferred = this.layout.show(view, at, navigation);
                    deferred.then(
                        lang.hitch(this, this._onLayoutShowComplete),
                        lang.hitch(this, this._onLayoutShowError)
                    );

                    return;
                }

                location = {tier: this.layout.panes[at].tier};
            }
            else if (typeof at === 'number')
            {
                location = {tier: at};
            }

            location = location || {tier: view.tier};

            if (this.layout.maximized > -1)
            {
                location.tier = this.layout.maximized;
            }

            /* todo: is `activate` the right name for this? */
            view.activate(options); /* activation required in order to build context (i.e. hash, etc.) */

            var stateSet = this._createStateSet(view, location),
                viewSet = this._createViewSet(stateSet, lang.mixin({primary: view.id}, navigation));

            /* todo: trim state to item before match of `stateSet` */
            this._trimStateTo(stateSet, navigation);

            // console.log('view set to apply: %o', viewSet);

            /*
              A scene tells the layout to apply a view set.  This causes the layout to invoke
              one or more transitions (usually only one, but potentially more).  The scene
              should not show another view until the transitions are all complete.  Each pane is
              responsible for it's own transition.

              scene => layout (apply)
              scene <= layout (deferred)
              scene wait

              layout => pane 0 (show)
              layout <= pane 0 (deferred)
              ...
              layout => pane N (show)
              layout <= pane N (deferred)
              layout wait 0..N
              layout complete scene deferred

              scene save state
             */
            deferred = this.layout.apply(viewSet);
            deferred.then(
                lang.hitch(this, this._onLayoutApplyComplete, stateSet),
                lang.hitch(this, this._onLayoutApplyError, stateSet)
            );

            return deferred;
        },
        _onLayoutShowComplete: function() {
            this._processQueue();
        },
        _onLayoutShowError: function() {
            console.log('show error!');
        },
        _onLayoutApplyComplete: function(stateSet) {
            this._state.push(stateSet);

            this._saveState();
            // console.log('current state: %o', this._state);

            this._processQueue();
        },
        _onLayoutApplyError: function(stateSet) {
            console.log('show error!');
        },
        _processQueue: function() {
            var next,
                remaining = [];

            console.log('processing queue');

            while (next = this._queue.shift())
            {
                var name = next[0];

                /* if the view is waiting for another view to finish being shown, put it back in the queue. */
                if (this._wait[name])
                {
                    console.log('%s is still waiting for %s', name, this._wait[name]);

                    remaining.push(next);
                }
                else
                {
                    this._showViewInstance.apply(this, next);
                }
            }

            this._idle = remaining.length === 0;
            this._queue = remaining;
        },
        _loadView: function(name, options, definition, at, navigation) {
            require([definition.type], lang.hitch(this, this._onRequireComplete, name, options, definition, at, navigation));
        },
        _restoreFromState: function(state) {
            var setCount = state.length;

            this._idle = false;

            for (var i = 0; i < (setCount - 1); i ++)
                window.location.hash = i;

            var latestStateSet = state[setCount -1],
                latestViewSet = this._createViewSet(latestStateSet, {});
            this._loadStateSet(latestStateSet, latestViewSet);
        },
        _loadStateSet: function(stateSet, viewSet) {
            this._idle = false;

            array.forEach(viewSet, function(item, index) {
                if (item.view) item.view.activate(stateSet[index].context.options, true);
            });

            /* todo: trim state to item before match of `stateSet` */
            this._trimStateTo(stateSet);

            // console.log('view set to apply: %o', viewSet);

            var deferred = this.layout.apply(viewSet);
            deferred.then(
                lang.hitch(this, this._onLayoutApplyComplete, stateSet),
                lang.hitch(this, this._onLayoutApplyError, stateSet)
            );

            return deferred;
        },
        _onRequireComplete: function(name, options, definition, at, navigation, ctor) {
            console.log('require complete: %s', name);

            /* todo: always replace id with name? */
            var instance = new ctor(lang.mixin({id: name}, definition.props));

            /* todo: safe to call this here? (not added to DOM yet) */
            instance.startup();

            this._instancedViews[name] = instance;

            if (this._idle)
            {
                if (this._wait[name])
                {
                    console.log('queuing show of %s due to wait for %s', name, this._wait[name]);
                    this._queue.push([name, instance, options, at, navigation]);
                }
                else
                {
                    this._showViewInstance(name, instance, options, at, navigation);
                }
            }
            else
            {
                console.log('queuing show of %s due to activity', name);
                this._queue.push([name, instance, options, at, navigation]);
            }
        },
        /**
         * Returns the view instance. Note that this creates a coupling that should normally be
         * avoided except for scenarios that require this additional hook.
         *
         * An example usage would be attempting to pull extra context from a previous view but doesn't
         * prevent manual entering.
         *
         * Example:
         *
         *    var view = scene().getView('account_detail');
         *
         * @param {String} name Unique identifier of the view to retrieve.
         * @return {Object} Instance of the named view.
         */
        getView: function(name) {
            return this._instancedViews[name];
        },

        /**
         * Goes back in the history. This magically handles the all the transitions,
         * state session, (and will handle browser history)
         * @param {Number} count Number of states to go back
         * @param {Object} navigation Navigation/transition options
         */
        back: function(count, navigation) {
            /* todo: this should return a deferred */

            if (typeof count !== 'number')
            {
                navigation = count;
                count = 1;
            }

            /* todo: let browser history handle this for us? use hashchange to do this? */
            if ((this._state.length - count) < 1) return;

            this._idle = false;

            this._state.splice(this._state.length - count);

            var stateSet = this._state[this._state.length - 1],
                viewSet = this._createViewSet(stateSet, lang.mixin({reverse: true}, navigation));

            array.forEach(viewSet, function(item, index) {
                if (item.view) item.view.activate(stateSet[index].context.options, true);
            });

            /* todo: trim state to item before match of `stateSet` */
            this._trimStateTo(stateSet);

            // console.log('view set to apply: %o', viewSet);

            var deferred = this.layout.apply(viewSet);
            deferred.then(
                lang.hitch(this, this._onLayoutApplyComplete, stateSet),
                lang.hitch(this, this._onLayoutApplyError, stateSet)
            );

            return deferred;
        }
    });
});
