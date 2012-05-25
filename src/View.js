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
    'dojo/dom-class',
    'dijit/_WidgetBase',
    './_EventMapMixin',
    './_UiComponent',
    'argos!application',
    'argos!customizations'
], function(
    declare,
    lang,
    domClass,
    _WidgetBase,
    _EventMapMixin,
    _UiComponent,
    application,
    customizations
) {
    return declare('Sage.Platform.Mobile.View', [_WidgetBase, _UiComponent, _EventMapMixin], {
        baseClass: 'view',
        titleText: 'Generic View',
        tools: null,
        layout: null,
        security: null,
        serviceName: false,
        connectionName: false,
        customizationSet: 'view',
        _getProtoComponentDeclarations: function() {
            var customizationSet = customizations();
            return customizationSet.apply(customizationSet.toPath(this.customizationSet, 'components', this.id), this.inherited(arguments));
        },
        _onToolbarPositionChange: function(position, previous) {
            if (previous) domClass.remove(this.domNode, 'has-toolbar-' + previous);

            domClass.add(this.domNode, 'has-toolbar-' + position);
        },
        getTools: function() {
            var customizationSet = customizations();
            return customizationSet.apply(customizationSet.toPath(this.customizationSet, 'tools', this.id), this.createToolLayout());
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

            ReUI.show(this.domNode, lang.mixin(transitionOptions || {}, {tag: this.getTag(), data: this.getContext()}));
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
        /**
         * @deprecated
         * @return {*}
         */
        getService: function() {
            return this.getConnection();
        },
        getConnection: function() {
            return application().getConnection(this.connectionName || this.serviceName);
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