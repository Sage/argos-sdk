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
    './Transition'
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
    TitleBar,
    transition
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
        show: function(view, showOptions) {
            return this._transition(view, view.options, showOptions);

            // var deferred = new Deferred();

            /* todo: why does this fix display issue on Android 3.0 tablet? */
            /* - the nodes are not painted correctly without the timeout
             * - some items are not displayed, normally the main view, but can be interacted with
             * - rotating the tablet causes it to paint correctly.
             * - even happens with OpenGL rendering disabled.
             */
            // setTimeout(lang.hitch(this, this._transition, view, view.options, deferred));

            // return deferred;
        },
        _before: function(view, viewOptions, previous) {
            console.log('before: %s', view.id);

            if (previous)
            {
                previous.beforeTransitionAway();
            }

            view.beforeTransitionTo();

            for (var name in this.toolbars)
            {
                var toolbar = this.toolbars[name];
                if (toolbar.managed)
                {
                    toolbar.set('title', view.get('title'));
                    toolbar.clear();
                    toolbar.show();
                }
            }

            topic.publish('/app/view/transition/before', view, previous, this);
        },
        _after: function(view, viewOptions, previous) {
            console.log('after: %s', view.id);

            this.active = view;

            var tools = (viewOptions && viewOptions.tools) || view.get('tools') || {};

            for (var name in this.toolbars)
            {
                var toolbar = this.toolbars[name];
                if (toolbar.managed)
                {
                    toolbar.set('items', tools[name]);
                }
                else
                {
                    toolbar.update();
                }
            }

            if (previous)
            {
                previous.transitionAway();
            }

            view.transitionTo();

            topic.publish('/app/view/transition/after', view, previous, this);

            this.resize();
        },
        _progress: function(view, options, previous, step) {
            if (step == transition.START) this._before(view, options, previous);
        },
        _error: function(view, options, previous, error) {
            console.error('transition error for %s', view.id);
            console.log(error);
        },
        _transition: function(view, viewOptions, showOptions) {
            console.log('transition: %s', view.id);

            var active = this.active;

            if (active === view)
            {
                /* todo: should we return a deferred? or use `when` on the calling side to handle both? */
                var deferred = new Deferred();

                /* todo: fully reset tools here? could update? only issue would be if new tools were passed for same active view. */
                this._before(view, viewOptions, view);

                /* todo: is `reload` an appropriate name for this? */
                console.log('reload: %s', view.id);

                view.reload();

                this._after(view, viewOptions, view);

                deferred.resolve(true);

                return deferred;
            }

            var deferred = new Deferred();

            deferred.then(
                lang.hitch(this, this._after, view, viewOptions, active),
                lang.hitch(this, this._error, view, viewOptions, active),
                lang.hitch(this, this._progress, view, viewOptions, active)
            );

            var fx = this._resolve(view, viewOptions, showOptions);

            return fx.method(this.viewContainerNode || this.domNode, view, active, fx.options, deferred);
        },
        _resolve: function(view, viewOptions, showOptions) {
            return {
                method: transition.slide,
                options: {reverse: showOptions && showOptions.reverse}
            };
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