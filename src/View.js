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
 * View is the root Class for all views and incorporates all the base features,
 * events, and hooks needed to successfully render, hide, show, and transition.
 *
 * All Views are dijit Widgets, namely utilizing its: widgetTemplate, connections, and attributeMap
 * @alternateClassName View
 * @mixins _ActionMixin
 * @mixins _CustomizationMixin
 * @mixins _Templated
 */
define('Sage/Platform/Mobile/View', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dijit/_Widget',
    'Sage/Platform/Mobile/_ActionMixin',
    'Sage/Platform/Mobile/_CustomizationMixin',
    'Sage/Platform/Mobile/_Templated'
], function(
    declare,
    lang,
    _Widget,
    _ActionMixin,
    _CustomizationMixin,
    _Templated
) {
    return declare('Sage.Platform.Mobile.View', [_Widget, _ActionMixin, _CustomizationMixin, _Templated], {
        /**
         * This map provides quick access to HTML properties, most notably the selected property of the container
         */
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
        /**
         * The widgetTemplate is a Simplate that will be used as the main HTML markup of the View.
         * @property {Simplate}
         */
        widgetTemplate: new Simplate([
            '<ul id="{%= $.id %}" title="{%= $.titleText %}" class="{%= $.cls %}">',
            '</ul>'
        ]),
        _loadConnect: null,
        /**
         * The id is used to uniquely define a view and is used in navigating, history and for HTML markup.
         * @property {String}
         */
        id: 'generic_view',
        /**
         * The titleText string will be applied to the top toolbar during {@link #show show}.
         */
        titleText: 'Generic View',
        /**
         * This views toolbar layout that defines all toolbar items in all toolbars.
         * @property {Object}
         */
        tools: null,
        /**
         * May be defined along with {@link App#hasAccessTo Application hasAccessTo} to incorporate View restrictions.
         */
        security: null,
        /**
         * May be used to specify the service name to use for data requests. Setting false will force the use of the default service.
         * @property {String/Boolean}
         */
        serviceName: false,

        /**
         * Called from {@link App#_viewTransitionTo Applications view transition handler} and returns
         * the fully customized toolbar layout.
         * @return {Object} The toolbar layout
         */
        getTools: function() {
            return this._createCustomizedLayout(this.createToolLayout(), 'tools');
        },
        /**
         * Returns the tool layout that defines all toolbar items for the view
         * @return {Object} The toolbar layout
         */
        createToolLayout: function() {
            return this.tools || {};
        },
        /**
         * Called on loading of the application.
         */
        init: function() {
            this.startup();
            this.initConnects();
        },
        /**
         * Establishes this views connections to various events
         */
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
        /**
         * Called in {@link #show show()} before ReUI is invoked.
         * @param {Object} options Navigation options passed from the previous view.
         * @return {Boolean} True indicates view needs to be refreshed.
         */
        refreshRequiredFor: function(options) {
            if (this.options)
                return !!options; // if options provided, then refresh
            else
                return true;
        },
        /**
         * Should refresh the view, such as but not limited to:
         * Emptying nodes, requesting data, rendering new content
         */
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
        /**
         * Shows the view using iUI in order to transition to the new element.
         * @param {Object} options The navigation options passed from the previous view.
         * @param transitionOptions {Object} Optional transition object that is forwarded to ReUI.
         */
        show: function(options, transitionOptions) {
            if (this.onShow(this) === false) return;

            if (this.refreshRequiredFor(options))
            {
                this.refreshRequired = true;
            }

            this.options = options || this.options || {};

            (this.options.title) ? this.set('title', this.options.title) : this.set('title', this.titleText);

            ReUI.show(this.domNode, lang.mixin(transitionOptions || {}, {tag: this.getTag(), data: this.getContext()}));
        },
        /**
         * Expands the passed expression if it is a function.
         * @param {String/Function} expression Returns string directly, if function it is called and the result returned.
         * @return {String} String expression.
         */
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        /**
         * Called before the view is transitioned (slide animation complete) to.
         */
        beforeTransitionTo: function() {
            this.onBeforeTransitionTo(this);
        },
        /**
         * Called before the view is transitioned (slide animation complete) away from.
         */
        beforeTransitionAway: function() {
            this.onBeforeTransitionAway(this);
        },
        /**
         * Called after the view has been transitioned (slide animation complete) to.
         */
        transitionTo: function() {
            if (this.refreshRequired)
            {
                this.refreshRequired = false;
                this.refresh();
            }

            this.onTransitionTo(this);
        },
        /**
         * Called after the view has been transitioned (slide animation complete) away from.
         */
        transitionAway: function() {
            this.onTransitionAway(this);
        },
        /**
         * Returns the primary SDataService instance for the view.
         * @return {Object} The Sage.SData.Client.SDataService instance.
         */
        getService: function() {
            return App.getService(this.serviceName); /* if false is passed, the default service will be returned */
        },
        getTag: function() {
        },
        /**
         * Returns the options used for the View {@link #getContext getContext()}.
         * @return {Object} Options to be used for context.
         */
        getOptionsContext: function() {
            if (this.options && this.options.negateHistory)
                return { negateHistory: true };
            else
                return this.options;
        },
        /**
         * Returns the context of the view which is a small summary of key properties.
         * @return {Object} Vital View properties.
         */
        getContext: function() {
            // todo: should we track options?
            return {id: this.id, options: this.getOptionsContext()};
        },
        /**
         * Returns the defined security.
         * @param access
         */
        getSecurity: function(access) {
            return this.security;
        }
    });
});