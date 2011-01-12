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

Ext.namespace('Sage.Platform.Mobile');

(function() {
    Sage.Platform.Mobile.View = Ext.extend(Ext.util.Observable, {
        attachmentPoints: {},
        viewTemplate: new Simplate([
            '<ul id="{%= $.id %}" title="{%= $.titleText %}" class="{%= $.cls %}">',
            '</ul>'
        ]),
        id: 'generic_view',
        titleText: 'Generic View',
        serviceName: false,
        constructor: function(options) {
            Ext.apply(this, options, {
                tools: {}
            });

            Sage.Platform.Mobile.View.superclass.constructor.apply(this, arguments);
        },
        render: function() {
            /// <summary>
            ///     Renders the view to the body of the page and stores the rendered element in the 'el' field.
            /// </summary>
            this.el = Ext.DomHelper.insertFirst(
                Ext.getBody(),
                this.viewTemplate.apply(this),
                true
            );

            for (var n in this.attachmentPoints)
                if (this.attachmentPoints.hasOwnProperty(n))
                    this[n] = this.el.child(this.attachmentPoints[n]);
        },
        init: function() {
            /// <summary>
            ///     Initializes the view by rendering calling render and binding any applicable events to the
            ///     view's main element.
            /// </summary>
            this.render();

            this.initEvents();
        },
        initEvents: function() {
            this.el.on('load', this._onLoad, this, {single: true});
            this.el.on('click', this._initiateActionFromClick,  this, {delegate: '[data-action]'});
        },
        _onLoad: function(evt, el, o) {
            this.load(evt, el, o);
        },
        _initiateActionFromClick: function(evt, el) {
            var el = Ext.get(el),
                action = el.getAttribute('data-action');

            if (this.hasAction(action, evt, el))
            {
                var parameters = this._getParametersForAction(action, evt, el);

                this.invokeAction(action, parameters, evt, el);
            }
        },
        _getParametersForAction: function(name, evt, el) {
            var parameters = {
                $event: evt,
                $source: el
            };

            for (var i = 0, attrLen = el.dom.attributes.length; i < attrLen; i++)
            {
                var attributeName = el.dom.attributes[i].name;
                if (/^((?=data-action)|(?!data))/.test(attributeName)) continue;

                /* transform hyphenated names to pascal case, minus the data segment, to be in line with HTML5 dataset naming conventions */
                /* see: http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data */
                /* todo: remove transformation and use dataset when browser support is there */
                var parameterName = attributeName.substr('data-'.length).replace(/-(\w)(\w+)/g, function($0, $1, $2) { return $1.toUpperCase() + $2; });

                parameters[parameterName] = el.getAttribute(attributeName);
            }

            return parameters;
        },
        hasAction: function(name, evt, el) {
            return (typeof this[name] === 'function');
        },
        invokeAction: function(name, parameters, evt, el) {            
            return this[name].apply(this, [parameters, evt, el]);
        },
        isActive: function() {
            return (this.el.getAttribute('selected') === 'true');
        },
        setTitle: function(title) {
            /// <summary>
            ///     Sets the title attribute on the view's main element.  This will be used by iUI during transition
            ///     to replace the title in the top bar.
            /// </summary>
            /// <param name="title" type="String">The new title.</param>
            this.el.dom.setAttribute('title', title);
        },
        load: function() {
            /// <summary>
            ///     Called once the first time the view is about to be transitioned to.
            /// </summary>
        },
        refreshRequiredFor: function(options) {
            if (this.options)
            {
                if (options) return true;

                return false;
            }
            else
                return true;
        },
        refresh: function() {
        },
        activate: function(tag, data) {
            // todo: use tag only?
            if (data && this.refreshRequiredFor(data.options))
            {
                this.refreshRequired = true;
            }

            this.options = data.options || this.options || {};

            if (this.options.title) this.setTitle(this.options.title);
        },
        show: function(options, transitionOptions) {
            /// <summary>
            ///     Show's the view using iUI in order to transition to the new element.
            /// </summary>
            if (this.refreshRequiredFor(options))
            {
                this.refreshRequired = true;
            }

            this.options = options || this.options || {};

            if (this.options.title) this.setTitle(this.options.title);

            ReUI.show(this.el.dom, Ext.apply(transitionOptions || {}, {tag: this.getTag(), data: this.getContext()}));
        },
        beforeTransitionTo: function() {
            /// <summary>
            ///     Called before the view is transitioned (slide animation complete) to.
            /// </summary>
        },
        beforeTransitionAway: function() {
            /// <summary>
            ///     Called before the view is transitioned (slide animation complete) away from.
            /// </summary>
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
        },
        transitionAway: function() {
            /// <summary>
            ///     Called after the view has been transitioned (slide animation complete) away from.
            /// </summary>
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
        }
    });
})();