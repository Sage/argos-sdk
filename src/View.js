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
 * All Views are dijit Widgets.
 * @alternateClassName View
 * @extends _UiComponent
 * @mixins _EventMapMixin
 */
define('argos/View', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    'Simplate',
    './_EventMapMixin',
    './_UiComponent',
    './Toolbar',
    './utility',
    'argos!application',
    'argos!customizations'
], function(
    declare,
    lang,
    array,
    domClass,
    _WidgetBase,
    Simplate,
    _EventMapMixin,
    _UiComponent,
    Toolbar,
    utility,
    application,
    customizations
) {
    return declare('argos.View', [_WidgetBase, _UiComponent, _EventMapMixin], {
        baseClass: 'view',
        title: null,

        /**
         * This views toolbar layout that defines all toolbar items in all toolbars.
         * @property {Object}
         */
        tools: null,
        toolbars: null,
        layout: null,

        /**
         * May be defined along with {@link App#hasAccessTo Application hasAccessTo} to incorporate View restrictions.
         */
        security: null,
        connection: null,

        /**
         * May be used to specify the service name to use for data requests. Setting false will force the use of
         * the default service.
         * @property {String/Boolean}
         */
        connectionName: false,
        customizationSet: 'view',

        /**
         * The titleText string will be applied to the top toolbar during {@link #show show}.
         */
        titleText: 'Generic View',
        constructor: function() {
            this.toolbars = {};
        },
        _preCreateComponents: function(components, proto) {
            if (proto)
            {
                var customizationSet = customizations();
                return customizationSet.apply(customizationSet.toPath(this.customizationSet, 'components', this.id), this.inherited(arguments));
            }
            else
            {
                return components;
            }
        },
        _onToolbarPositionChange: function(position, previous) {
            if (previous) domClass.remove(this.domNode, 'has-toolbar-' + previous);

            domClass.add(this.domNode, 'has-toolbar-' + position);
        },
        _getToolsAttr: function() {
            var customizationSet = customizations();
            return customizationSet.apply(customizationSet.toPath(this.customizationSet, 'tools', this.id), this.createToolLayout());
        },
        _setToolsAttr: function(value) {
            this.tools = value;
        },

        /**
         * Returns the tool layout that defines all toolbar items for the view
         * @return {Object} The toolbar layout
         */
        createToolLayout: function() {
            return this.tools || {};
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
            console.log('refresh: %s', this.id);

            this.clear();
            this.load();
        },
        clear: function() {
        },
        load: function() {
        },
        resize: function() {
            if (!this.refreshRequired) this.onContentChange();
        },
        onContentChange: function() {
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
        activate: function(options) {
            if (this.refreshRequiredFor(options))
            {
                this.refreshRequired = true;
            }

            this.options = options || this.options || {};

            (this.options.title) ? this.set('title', this.options.title) : this.set('title', this.titleText);

            this.onActivate(this);
        },
        /**
         * Alias to {@link utility#expand utility.expand}.
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
            for (var name in this.toolbars)
            {
                var toolbar = this.toolbars[name];
                if (toolbar.managed)
                {
                    toolbar.clear();
                    toolbar.show();
                }
            }

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
                this.load();
            }

            var toolsFromOptions = this.options && this.options.tools || {},
                toolsFromSelf = this.get('tools') || {};

            for (var name in this.toolbars)
            {
                var toolbar = this.toolbars[name];
                if (toolbar.managed)
                {
                    toolbar.set('items', toolsFromOptions[name] || toolsFromSelf[name]);
                }
                else
                {
                    toolbar.update();
                }
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
         * Alias for {@link App#getConnection App.getConnection} passing `this.connectionName`.
         */
        getConnection: function() {
            return application().getConnection(this.connectionName);
        },
        getTag: function() {
        },
        /**
         * Returns the context of the view which is a small summary of key properties.
         * @return {Object} Vital View properties.
         */
        getContext: function() {
            // todo: should we track options?
            return {view: this.id, options: this.options, boundary: this.options.negateHistory};
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