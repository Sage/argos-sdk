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
    'dijit/_WidgetBase',
    './_ActionMixin',
    './_CustomizationMixin',
    './_TemplatedWidgetMixin',
    './_EventMapMixin',
    './_UiComponent',
    './_ScrollViewMixin',
    './ScrollContainer',
    './Toolbar'
], function(
    declare,
    lang,
    _WidgetBase,
    _ActionMixin,
    _CustomizationMixin,
    _TemplatedWidgetMixin,
    _EventMapMixin,
    _UiComponent,
    _ScrollViewMixin,
    ScrollContainer,
    Toolbar
) {
    return declare('Sage.Platform.Mobile.View', [_WidgetBase, _UiComponent, _EventMapMixin], {
        baseClass: 'view',
        components: [
            {tag: 'div', attrs: {'class':'toolbar'}},
            {type: ScrollContainer, attachPoint: 'scrollContainer', subscribeEvent: {'onContentChanged':'onContentChanged'}, components: [
                {tag: 'div', attrs: {}, components: [
                    {content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus feugiat, justo id egestas luctus, risus urna tempor turpis, sit amet ornare ante purus eget ante. Aliquam tempus tempor elit, id lobortis tellus gravida in. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam accumsan mauris nec enim sagittis vel aliquet risus pharetra. Aenean et felis quam, id pulvinar velit. Donec lacinia fermentum augue, sed ultrices odio dapibus id. Sed fringilla urna lacinia neque blandit adipiscing. Phasellus rutrum ipsum a sapien molestie vulputate. Praesent at urna nulla. Suspendisse interdum placerat varius. Sed id arcu lorem. Fusce nec nibh mauris, eget dictum mi. Proin lectus arcu, eleifend a aliquet quis, molestie laoreet massa. Praesent hendrerit, risus non ullamcorper gravida, nisl turpis euismod libero, quis sagittis massa elit eu massa. Mauris velit dui, vehicula vitae facilisis porta, faucibus id libero. Phasellus vestibulum adipiscing auctor.  Proin eget aliquam dui. Pellentesque faucibus urna nec velit porta interdum. Duis feugiat fringilla luctus. Aliquam erat volutpat. Sed sed ipsum metus. Nunc rutrum aliquam lobortis. Fusce eleifend leo viverra elit volutpat ornare. Nulla vel libero ante, pulvinar porta leo.  Vestibulum vitae urna lectus. Praesent a nibh lorem, nec porttitor ligula. Donec egestas sodales diam nec posuere. Fusce pellentesque molestie malesuada. Phasellus mi quam, condimentum a cursus sed, malesuada sed quam. Suspendisse pellentesque scelerisque sapien, id iaculis sem posuere sed. Suspendisse in felis id diam sodales accumsan quis sed neque. Proin auctor cursus pretium. Mauris accumsan leo vestibulum dui elementum dictum scelerisque odio mollis. In quis velit non mauris lacinia accumsan non convallis mauris. Morbi vitae molestie risus. Fusce in risus urna, vitae adipiscing tellus. Phasellus sollicitudin urna sed odio molestie molestie.  Praesent consectetur dui et erat bibendum at varius dui ultricies. In accumsan, nisi pretium blandit porttitor, enim lacus molestie elit, quis sodales massa tortor a eros. Nunc lorem sapien, pretium a rhoncus quis, faucibus cursus purus. Nullam a dui enim. Vestibulum ultricies sagittis turpis id laoreet. Pellentesque consectetur rutrum facilisis. Ut mattis neque sit amet quam pharetra ultricies. Praesent vitae purus et metus interdum euismod.  Donec ut neque elit, vitae varius lacus. Sed interdum sodales libero, in aliquam leo pretium quis. Quisque tristique massa sed odio venenatis ut euismod dolor sodales. Aenean gravida consequat enim vestibulum suscipit. Proin quis ipsum lacus, dictum posuere dui. Sed tristique elit in diam faucibus sit amet ornare felis consectetur. Pellentesque consectetur eleifend dui, sed tempor urna iaculis vitae. Aenean nec mi et massa porttitor consequat. Vestibulum venenatis ultrices tristique.</p>'}
                ]}
            ]}/*,
            {tag: 'div', attrs: {'class':'scroll-container'}, attachPoint:'scrollContainerNode', components: [
                {tag: 'div', attrs: {'class':'scroll-content'}, components: [
                    {content: '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus feugiat, justo id egestas luctus, risus urna tempor turpis, sit amet ornare ante purus eget ante. Aliquam tempus tempor elit, id lobortis tellus gravida in. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam accumsan mauris nec enim sagittis vel aliquet risus pharetra. Aenean et felis quam, id pulvinar velit. Donec lacinia fermentum augue, sed ultrices odio dapibus id. Sed fringilla urna lacinia neque blandit adipiscing. Phasellus rutrum ipsum a sapien molestie vulputate. Praesent at urna nulla. Suspendisse interdum placerat varius. Sed id arcu lorem. Fusce nec nibh mauris, eget dictum mi. Proin lectus arcu, eleifend a aliquet quis, molestie laoreet massa. Praesent hendrerit, risus non ullamcorper gravida, nisl turpis euismod libero, quis sagittis massa elit eu massa. Mauris velit dui, vehicula vitae facilisis porta, faucibus id libero. Phasellus vestibulum adipiscing auctor.  Proin eget aliquam dui. Pellentesque faucibus urna nec velit porta interdum. Duis feugiat fringilla luctus. Aliquam erat volutpat. Sed sed ipsum metus. Nunc rutrum aliquam lobortis. Fusce eleifend leo viverra elit volutpat ornare. Nulla vel libero ante, pulvinar porta leo.  Vestibulum vitae urna lectus. Praesent a nibh lorem, nec porttitor ligula. Donec egestas sodales diam nec posuere. Fusce pellentesque molestie malesuada. Phasellus mi quam, condimentum a cursus sed, malesuada sed quam. Suspendisse pellentesque scelerisque sapien, id iaculis sem posuere sed. Suspendisse in felis id diam sodales accumsan quis sed neque. Proin auctor cursus pretium. Mauris accumsan leo vestibulum dui elementum dictum scelerisque odio mollis. In quis velit non mauris lacinia accumsan non convallis mauris. Morbi vitae molestie risus. Fusce in risus urna, vitae adipiscing tellus. Phasellus sollicitudin urna sed odio molestie molestie.  Praesent consectetur dui et erat bibendum at varius dui ultricies. In accumsan, nisi pretium blandit porttitor, enim lacus molestie elit, quis sodales massa tortor a eros. Nunc lorem sapien, pretium a rhoncus quis, faucibus cursus purus. Nullam a dui enim. Vestibulum ultricies sagittis turpis id laoreet. Pellentesque consectetur rutrum facilisis. Ut mattis neque sit amet quam pharetra ultricies. Praesent vitae purus et metus interdum euismod.  Donec ut neque elit, vitae varius lacus. Sed interdum sodales libero, in aliquam leo pretium quis. Quisque tristique massa sed odio venenatis ut euismod dolor sodales. Aenean gravida consequat enim vestibulum suscipit. Proin quis ipsum lacus, dictum posuere dui. Sed tristique elit in diam faucibus sit amet ornare felis consectetur. Pellentesque consectetur eleifend dui, sed tempor urna iaculis vitae. Aenean nec mi et massa porttitor consequat. Vestibulum venenatis ultrices tristique.</p>'}
                ]}
            ]}*/
        ],
        onContentChanged: function() {
        }
        /*
        widgetTemplate: new Simplate([
            '<div>',
                '<div class="toolbar"></div>',
                '<div class="scroll-container" data-dojo-attach-point="scrollContainerNode">',
                '<div class="scroll-content">',
                '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus feugiat, justo id egestas luctus, risus urna tempor turpis, sit amet ornare ante purus eget ante. Aliquam tempus tempor elit, id lobortis tellus gravida in. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam accumsan mauris nec enim sagittis vel aliquet risus pharetra. Aenean et felis quam, id pulvinar velit. Donec lacinia fermentum augue, sed ultrices odio dapibus id. Sed fringilla urna lacinia neque blandit adipiscing. Phasellus rutrum ipsum a sapien molestie vulputate. Praesent at urna nulla. Suspendisse interdum placerat varius. Sed id arcu lorem. Fusce nec nibh mauris, eget dictum mi. Proin lectus arcu, eleifend a aliquet quis, molestie laoreet massa. Praesent hendrerit, risus non ullamcorper gravida, nisl turpis euismod libero, quis sagittis massa elit eu massa. Mauris velit dui, vehicula vitae facilisis porta, faucibus id libero. Phasellus vestibulum adipiscing auctor.  Proin eget aliquam dui. Pellentesque faucibus urna nec velit porta interdum. Duis feugiat fringilla luctus. Aliquam erat volutpat. Sed sed ipsum metus. Nunc rutrum aliquam lobortis. Fusce eleifend leo viverra elit volutpat ornare. Nulla vel libero ante, pulvinar porta leo.  Vestibulum vitae urna lectus. Praesent a nibh lorem, nec porttitor ligula. Donec egestas sodales diam nec posuere. Fusce pellentesque molestie malesuada. Phasellus mi quam, condimentum a cursus sed, malesuada sed quam. Suspendisse pellentesque scelerisque sapien, id iaculis sem posuere sed. Suspendisse in felis id diam sodales accumsan quis sed neque. Proin auctor cursus pretium. Mauris accumsan leo vestibulum dui elementum dictum scelerisque odio mollis. In quis velit non mauris lacinia accumsan non convallis mauris. Morbi vitae molestie risus. Fusce in risus urna, vitae adipiscing tellus. Phasellus sollicitudin urna sed odio molestie molestie.  Praesent consectetur dui et erat bibendum at varius dui ultricies. In accumsan, nisi pretium blandit porttitor, enim lacus molestie elit, quis sodales massa tortor a eros. Nunc lorem sapien, pretium a rhoncus quis, faucibus cursus purus. Nullam a dui enim. Vestibulum ultricies sagittis turpis id laoreet. Pellentesque consectetur rutrum facilisis. Ut mattis neque sit amet quam pharetra ultricies. Praesent vitae purus et metus interdum euismod.  Donec ut neque elit, vitae varius lacus. Sed interdum sodales libero, in aliquam leo pretium quis. Quisque tristique massa sed odio venenatis ut euismod dolor sodales. Aenean gravida consequat enim vestibulum suscipit. Proin quis ipsum lacus, dictum posuere dui. Sed tristique elit in diam faucibus sit amet ornare felis consectetur. Pellentesque consectetur eleifend dui, sed tempor urna iaculis vitae. Aenean nec mi et massa porttitor consequat. Vestibulum venenatis ultrices tristique.</p>',
                '</div>',
                '</div>',
            '</div>'
        ])
        */
    });

    return declare('Sage.Platform.Mobile.ViewOld', [_Widget, _ActionMixin, _CustomizationMixin, _TemplatedWidgetMixin], {
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

            ReUI.show(this.domNode, lang.mixin(transitionOptions || {}, {tag: this.getTag(), data: this.getContext()}));
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