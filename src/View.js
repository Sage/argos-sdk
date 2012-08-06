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

define('Sage/Platform/Mobile/View', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    './_EventMapMixin',
    './_UiComponent',
    './Toolbar',
    'argos!application',
    'argos!customizations'
], function(
    declare,
    lang,
    array,
    domClass,
    _WidgetBase,
    _EventMapMixin,
    _UiComponent,
    Toolbar,
    application,
    customizations
) {
    return declare('Sage.Platform.Mobile.View', [_WidgetBase, _UiComponent, _EventMapMixin], {
        baseClass: 'view',
        title: null,
        tools: null,
        toolbars: null,
        layout: null,
        security: null,
        connection: null,
        connectionName: false,
        customizationSet: 'view',
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
        createToolLayout: function() {
            return this.tools || {};
        },
        refreshRequiredFor: function(options) {
            if (this.options)
                return !!options; // if options provided, then refresh
            else
                return true;
        },
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
         * @param expression
         * @return {*}
         */
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        beforeTransitionTo: function() {
            /// <summary>
            ///     Called before the view is transitioned (slide animation complete) to.
            /// </summary>
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
        transitionAway: function() {
            /// <summary>
            ///     Called after the view has been transitioned (slide animation complete) away from.
            /// </summary>

            this.onTransitionAway(this);
        },
        getConnection: function() {
            return application().getConnection(this.connectionName);
        },
        getTag: function() {
        },
        getContext: function() {
            // todo: should we track options?
            return {view: this.id, options: this.options, boundary: this.options.negateHistory};
        },
        getSecurity: function(access) {
            return this.security;
        }
    });
});