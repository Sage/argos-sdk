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

define('Sage/Platform/Mobile/Scene', [
    'require',
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/window',
    './_Component',
    './Layout',
    './View'
], function(
    require,
    array,
    declare,
    lang,
    win,
    _Component,
    Layout,
    View
) {
    return declare('Sage.Platform.Mobile.Scene', [_Component], {
        _registeredViews: null,
        _instancedViews: null,
        _state: null,
        _panes: null,
        components: [
            {type: Layout, attachPoint: 'layout'}
        ],
        layout: null,

        constructor: function(options) {
            this._registeredViews = {};
            this._instancedViews = {};

            this._state = [];
            this._panes = [];

            lang.mixin(this, options);
        },
        startup: function() {
            this.layout.placeAt(win.body());

            for (var name in this.layout.panes)
            {
                var pane = this.layout.panes[name];
                if (pane.tier !== false)
                {
                    this._panes[pane.tier] = pane;
                }
            }

            this.inherited(arguments);
        },
        destroy: function() {
            this.inherited(arguments);

            for (var name in this._instancedViews)
            {
                this._instancedViews[name].destroy();
            }

            this._registeredViews = null;
            this._instancedViews = null;

            this._state = null;
            this._panes = null;
        },
        registerViews: function(definitions) {
            for (var name in definitions)
            {
                this.registerView(name, definitions[name]);
            }
        },
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
        hasView: function(name) {
            return !!(this._instancedViews[name] || this._registeredViews[name]);
        },
        showView: function(name, options, at) {
            var instance = this._instancedViews[name];
            if (instance)
            {
                this._showViewInstance(instance, options, at);

                return;
            }

            var definition = this._registeredViews[name];
            if (definition)
            {
                /* todo: figure out why a `setTimeout` is required here */
                /* if `require` is called within a `require` as part of `dojo/domReady!`, the
                   page `load` event will not fire. */
                setTimeout(lang.hitch(this, this._loadView, name, options, definition, at), 0);
            }
        },
        _createStateSet: function(view, at) {

        },
        _showViewInstance: function(view, options, at) {
            if (typeof at === 'number') at = {tier: at};
            if (typeof at === 'string') at = {tier: this.layout.panes[at].tier};

            at = at || {tier: view.tier};

            /* todo: navigation context tracking */

            /* we've added it to the logical representation of the view state, now we */
            /* add it to the physical representation of the view state */



            if (this.layout)
                this.layout.show(view, options, at);
        },
        _loadView: function(name, options, definition, at) {
            require([definition.type], lang.hitch(this, this._showViewOnRequired, name, options, definition, at));
        },
        _showViewOnRequired: function(name, options, definition, at, ctor) {
            /* todo: always replace id with name? */
            var instance = new ctor(lang.mixin({id: name}, definition.props));

            /* todo: safe to call this here? (not added to DOM yet) */
            instance.startup();

            this._instancedViews[name] = instance;

            this._showViewInstance(instance, options, at);
        }
    });
});