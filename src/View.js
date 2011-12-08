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

define('Sage/Platform/Mobile/View', ['dojo', 'dojo/string', 'dojo/NodeList-manipulate', 'dojo/NodeList-traverse', 'dijit/_Widget', 'Sage/Platform/Mobile/_ActionMixin', 'Sage/Platform/Mobile/_CustomizationMixin', 'Sage/Platform/Mobile/_Templated', 'Sage/Platform/Mobile/ErrorManager'], function() {

    return dojo.declare('Sage.Platform.Mobile.View', [dijit._Widget, Sage.Platform.Mobile._ActionMixin, Sage.Platform.Mobile._CustomizationMixin, Sage.Platform.Mobile._Templated], {
        attributeMap: {
            'title': {
                node: 'domNode',
                type: 'attribute',
                attribute: 'title'
            },
            'selected': {
                node: 'domNode',
                type: 'attribute',
                attribute: 'selected'
            }
        },
        widgetTemplate: new Simplate([
            '<ul id="{%= $.id %}" title="{%= $.titleText %}" class="{%= $.cls %}">',
            '</ul>'
        ]),
        _loadConnect: null,
        id: 'generic_view',
        titleText: 'Generic View',
        tools: null,
        security: null,
        serviceName: false,
 
        getTools: function() {
            return this._createCustomizedLayout(this.createToolLayout(), 'tools');
        },
        createToolLayout: function() {
            return this.tools || {};
        },
        init: function() {
            this.startup();
            this.initConnects();
        },
        initConnects: function() {
            this._loadConnect = this.connect(this.domNode, 'onload', this._onLoad);
        },
        _onLoad: function(evt, el, o) {
            this.disconnect(this._loadConnect);

            this.load(evt, el, o);
        },
        /**
         * Called once the first time the view is about to be transitioned to.
         * @deprecated
         */
        load: function() {
            // todo: remove load entirely?
        },
        refreshRequiredFor: function(options) {
            if (this.options)
                return !!options; // if options provided, then refresh
            else
                return true;
        },
        refresh: function() {
        },
        /**
         * The onBeforeTransitionAway event.
         * @param self
         */
        onBeforeTransitionAway: function(self) {
        },
        /**
         * The onBeforeTransitionTo event.
         * @param self
         */
        onBeforeTransitionTo: function(self) {
        },
        /**
         * The onTransitionAway event.
         * @param self
         */
        onTransitionAway: function(self) {
        },
        /**
         * The onTransitionTo event.
         * @param self
         */
        onTransitionTo: function(self) {
        },
        /**
         * The onActivate event.
         * @param self
         */
        onActivate: function(self) {
        },
        /**
         * The onShow event.
         * @param self
         */
        onShow: function(self) {
        },
        activate: function(tag, data) {
            // todo: use tag only?
            if (data && this.refreshRequiredFor(data.options))
            {
                this.refreshRequired = true;
            }

            this.options = data.options || this.options || {};

            (this.options.title) ? this.set('title', this.options.title) : this.set('title', this.titleText);

            this.onActivate(this);
        },
        show: function(options, transitionOptions) {
            /// <summary>
            ///     Shows the view using iUI in order to transition to the new element.
            /// </summary>

            if (this.onShow(this) === false) return;

            if (this.refreshRequiredFor(options))
            {
                this.refreshRequired = true;
            }

            this.options = options || this.options || {};

            (this.options.title) ? this.set('title', this.options.title) : this.set('title', this.titleText);

            ReUI.show(this.domNode, dojo.mixin(transitionOptions || {}, {tag: this.getTag(), data: this.getContext()}));
        },
        expandExpression: function(expression) {
            /// <summary>
            ///     Expands the passed expression if it is a function.
            /// </summary>
            /// <param name="expression" type="String">
            ///     1: function - Called on this object and must return a string.
            ///     2: string - Returned directly.
            /// </param>
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        beforeTransitionTo: function() {
            /// <summary>
            ///     Called before the view is transitioned (slide animation complete) to.
            /// </summary>
            
            this.onBeforeTransitionTo(this);
        },
        beforeTransitionAway: function() {
            /// <summary>
            ///     Called before the view is transitioned (slide animation complete) away from.
            /// </summary>

            this.onBeforeTransitionAway(this);
        },
        transitionTo: function() {
            /// <summary>
            ///     Called after the view has been transitioned (slide animation complete) to.
            /// </summary>
            if (this.refreshRequired)
            {
                this.refreshRequired = false;
                this.refresh();
            }

            this.onTransitionTo(this);
        },
        transitionAway: function() {
            /// <summary>
            ///     Called after the view has been transitioned (slide animation complete) away from.
            /// </summary>

            this.onTransitionAway(this);
        },
        getService: function() {
            /// <summary>
            ///     Returns the primary SDataService instance for the view.
            /// </summary>
            /// <returns type="Sage.SData.Client.SDataService">The SDataService instance.</returns>
            return App.getService(this.serviceName); /* if false is passed, the default service will be returned */
        },
        getTag: function() {
        },
        getContext: function() {
            // todo: should we track options?
            return {id: this.id, options: this.options};
        },
        getSecurity: function(access) {
            return this.security;
        }
    });
});