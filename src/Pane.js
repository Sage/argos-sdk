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

            /* todo: use the same method as the view in order to discover toolbars */
            array.forEach(this.getComponents(), function(component) {
                if (component.isInstanceOf(Toolbar)) this.toolbars[component.getComponentName()] = component;
            }, this);
        },
        show: function(view, transitionOptions) {
            // return this._transition(view, view.options, transitionOptions);

            var deferred = new Deferred();

            /* todo: why does this fix display issue on Android 3.0/4.0 tablet? */
            /* - the nodes are not painted correctly without the timeout
             * - some items are not displayed, normally the main view, but can be interacted with
             * - rotating the tablet causes it to paint correctly.
             * - happens with OpenGL rendering enabled or disabled.
             */
            setTimeout(lang.hitch(this, this._transition, view, view.options, transitionOptions, deferred), 0);

            return deferred;
        },
        _before: function(view, viewOptions, previous) {
            console.log('before: %s', (view && view.id) || 'empty');

            if (previous)
            {
                previous.beforeTransitionAway();
            }

            if (view)
            {
                view.beforeTransitionTo();
            }

            for (var name in this.toolbars)
            {
                var toolbar = this.toolbars[name];
                if (toolbar.managed)
                {
                    if (view)
                    {
                        toolbar.set('title', view.get('title'));
                        toolbar.clear();
                        toolbar.show();
                    }
                    else
                    {
                        toolbar.hide();
                        toolbar.clear();
                    }
                }
            }

            topic.publish('/app/view/transition/before', view, previous, this);
        },
        _after: function(view, viewOptions, previous) {
            console.log('after: %s', (view && view.id) || 'empty');

            this.active = view;

            if (view)
            {
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
            }

            if (previous)
            {
                previous.transitionAway();
            }

            if (view)
            {
                view.transitionTo();
            }

            topic.publish('/app/view/transition/after', view, previous, this);

            this.resize();
        },
        _progress: function(view, viewOptions, previous, step) {
            if (step == transition.START) this._before(view, viewOptions, previous);
        },
        _error: function(view, viewOptions, previous, error) {
            console.error('transition error for %s', (view && view.id) || 'empty');
            console.log(error);
        },
        _transition: function(view, viewOptions, transitionOptions, deferred) {
            console.log('transition: %s', (view && view.id) || 'empty');

            var active = this.active;
            if (active === view && !transitionOptions.always)
            {
                /* todo: should we return a deferred? or use `when` on the calling side to handle both? */
                deferred = deferred || new Deferred();

                /* todo: fully reset tools here? could update? only issue would be if new tools were passed for same active view. */
                this._before(view, viewOptions, view);

                /* todo: is `reload` an appropriate name for this? */
                /* todo: is a function call necessary since view lifecycle will occur in _before/_after? */
                console.log('reload: %s', (view && view.id) || 'empty');

                this._after(view, viewOptions, view);

                deferred.resolve(true);

                return deferred;
            }

            deferred = deferred || new Deferred();

            deferred.then(
                lang.hitch(this, this._after, view, viewOptions, active),
                lang.hitch(this, this._error, view, viewOptions, active),
                lang.hitch(this, this._progress, view, viewOptions, active)
            );

            var fx = transition.findByName(transitionOptions.transition);

            return fx(this.viewContainerNode || this.domNode, view, active === view ? null : active, transitionOptions, deferred);
        },
        empty: function(transitionOptions) {
            console.log('empty: %s', this.id);

            if (this.active)
            {
                return this._transition(null, null, transitionOptions);
            }
            else
            {
                var deferred = new Deferred();

                deferred.resolve(true);

                return deferred;
            }

            /*
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
            */
        },
        resize: function() {
            // do not call base implementation (FixedSplitterPane)
            // only resize active child (for performance)
            if (this.active && this.active.resize)
                this.active.resize();
        }
    });
});