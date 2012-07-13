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

define('Sage/Platform/Mobile/Pane', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/Deferred',
    'dojo/topic',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/dom-attr',
    'dojox/mobile/FixedSplitterPane',
    './_UiComponent',
    './Toolbar',
    './TitleBar',
    './View'
], function(
    declare,
    lang,
    array,
    Deferred,
    topic,
    domStyle,
    domClass,
    domAttr,
    FixedSplitterPane,
    _UiComponent,
    Toolbar,
    TitleBar
) {
    return declare('Sage.Platform.Mobile.Pane', [FixedSplitterPane, _UiComponent], {
        components: [
            {name: 'top', type: TitleBar, attachEvent: 'onPositionChange:_onToolbarPositionChange', props: {managed: true, visible: false}},
            {name: 'container', tag: 'div', attrs: {'class': 'view-container'}, attachPoint: 'viewContainerNode'}
        ],
        viewContainerNode: null,
        active: null,
        toolbars: null,

        constructor: function() {
            this.toolbars = {};
        },
        _onToolbarPositionChange: function(position, previous) {
            if (previous) domClass.remove(this.domNode, 'has-toolbar-' + previous);

            domClass.add(this.domNode, 'has-toolbar-' + position);
        },
        onStartup: function() {
            this.inherited(arguments);

            array.forEach(this.getComponents(), function(component) {
                if (component.isInstanceOf(Toolbar)) this.toolbars[component.getComponentName()] = component;
            }, this);
        },
        show: function(view) {
            var deferred = new Deferred();

            /* - add the new view to this domNode
             * - do transition, remove old view from domNode ?
             * - or leave view in the container until it is needed elsewhere?
             * - save on dom movement and better back button support?
             *
             * - or have several configurations of views, one for tablets, and one for mobile?
             *   where views are assigned directly to containers?
             */

            /* todo: why does this fix display issue on Android 3.0 tablet? */
            /* - the nodes are not painted correctly without the timeout
             * - some items are not displayed, normally the main view, but can be interacted with
             * - rotating the tablet causes it to paint correctly.
             * - even happens with OpenGL rendering disabled.
             */
            setTimeout(lang.hitch(this, this._transitionTo, view, view.options, deferred));

            return deferred;
        },
        _beforeTransition: function(view, options, previous) {
            for (var name in this.toolbars)
            {
                var toolbar = this.toolbars[name];
                if (toolbar.managed)
                {
                    toolbar.clear();
                    toolbar.show();
                }
            }

            topic.publish('/app/view/transition/before', view, previous, this);
        },
        _afterTransition: function(view, options, previous) {
            var tools = (options && options.tools) || view.get('tools') || {};

            for (var name in this.toolbars)
            {
                var toolbar = this.toolbars[name];
                if (toolbar.managed)
                {
                    toolbar.set('title', view.get('title'));
                    toolbar.set('items', tools[name]);
                }
                else
                {
                    toolbar.update();
                }
            }

            topic.publish('/app/view/transition/after', view, previous, this);
        },
        _transitionTo: function(view, options, deferred) {
            console.log('transition: %s', view.id);

            if (this.active === view)
            {
                /* todo: fully reset tools here? could update? only issue would be if new tools were passed for same active view. */
                this._beforeTransition(view, options, view);

                /* todo: is `reload` an appropriate name for this? */
                console.log('reload: %s', view.id);

                view.reload();

                this._afterTransition(view, options, view);

                deferred.resolve(true);

                return deferred;
            }

            var previous = this.active;

            if (previous)
            {
                previous.beforeTransitionAway();
            }

            view.beforeTransitionTo();

            domClass.remove(view.domNode, 'is-visible');

            view.placeAt(this.viewContainerNode || this.domNode);

            this._beforeTransition(view, options, previous);

            if (previous)
            {
                domClass.remove(previous.domNode, 'is-visible');
            }

            domClass.add(view.domNode, 'is-visible');

            if (previous)
            {
                previous.transitionAway();
            }

            view.transitionTo();

            this.active = view;

            domAttr.set(this.domNode, 'data-active-view', view.id);
            domAttr.set(this.domNode, 'data-active-view-kind', view.customizationSet);

            this._afterTransition(view, options, previous);

            this.resize();

            deferred.resolve(true);
        },
        empty: function() {
            console.log('empty: %s', this.id);

            var deferred = new Deferred(),
                previous = this.active;

            if (previous)
            {
                if (previous.domNode && previous.domNode.parentNode)
                    previous.domNode.parentNode.removeChild(previous.domNode);
            }

            for (var name in this.toolbars)
            {
                var toolbar = this.toolbars[name];

                toolbar.hide();
            }

            this.active = null;

            domAttr.set(this.domNode, 'data-active-view', '');
            domAttr.set(this.domNode, 'data-active-view-kind', '');

            this.resize();

            deferred.resolve(true);

            return deferred;
        },
        resize: function() {
            // do not call base implementation (FixedSplitterPane)
            // only resize active child (for performance)
            if (this.active && this.active.resize)
                this.active.resize();
        }
    });
});