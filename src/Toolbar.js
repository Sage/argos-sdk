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

define('Sage/Platform/Mobile/Toolbar', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-style',
    'dojo/dom-class',
    'dijit/_WidgetBase',
    './_EventMapMixin',
    './_UiComponent',
    './Utility'
], function(
    declare,
    lang,
    domStyle,
    domClass,
    _WidgetBase,
    _EventMapMixin,
    _UiComponent
) {
    return declare('Sage.Platform.Mobile.Toolbar', [_WidgetBase, _EventMapMixin, _UiComponent], {
        baseClass: 'toolbar',
        position: 'top',
        components: [
            {tag: 'h1', attrs: {'class':'toolbar-title'}, attachPoint: 'titleNode'}
        ],
        _setTitleAttr: {node: 'titleNode', type: 'innerHTML'},
        _getPositionAttr: function() {
            return this.position;
        },
        _setPositionAttr: function(value) {
            var previous = this.position;

            domClass.remove(this.domNode, 'toolbar-' + previous);
            domClass.add(this.domNode, 'toolbar-' + value);

            this.position = value;

            this.onPositionChange(value, previous);
        },
        onPositionChange: function(position, previous) {
        },
        onCreate: function() {
            this.inherited(arguments);
            this.onPositionChange(this.position, null);
        }
    });

    /*
    return declare('Sage.Platform.Mobile.Toolbar', [_Widget, _ActionMixin, _Templated], {
        widgetTemplate: new Simplate([
            '<div class="toolbar">',
            '</div>'
        ]),
        enabled: true,
        managed: true,
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        init: function() {
        },
        invokeTool: function(parameters, evt, el) {
            var id = parameters && parameters.tool,
                tool = this.tools && this.tools[id],
                source = tool && tool.source;
            if (source && tool.enabled)
            {
                if (source.fn)
                {
                    source.fn.call(source.scope || this, source);
                }
                else if (source.action)
                {
                    var view = App.getPrimaryActiveView();
                    if (view && view.hasAction(source.action))
                        view.invokeAction(source.action, lang.mixin(parameters, {'$tool': source}), evt, el);
                }
            }
        },
        show: function() {
            domStyle.set(this.domNode, "display", "block");
        },
        hide: function() {
            domStyle.set(this.domNode, "display", "none");
        },
        clear: function() {
            this.tools = {};
            domClass.remove(this.domNode, 'toolbar-disabled');
            this.enabled = true;
        },
        enable: function() {
            domClass.remove(this.domNode, 'toolbar-disabled');
            this.enabled = true;
        },
        disable: function() {
            domClass.add(this.domNode, 'toolbar-disabled');
            this.enabled = false;
        },
        enableTool: function(id) {
            var tool = this.tools && this.tools[id];
            if (tool)
                tool.enabled = true;
        },
        disableTool: function(id) {
            var tool = this.tools && this.tools[id];
            if (tool)
                tool.enabled = false;
        },
        indicateToolBusy: function(id) {
            var tool = this.tools && this.tools[id];
            if (tool)
                tool.busy = true;
        },
        clearToolBusy: function(id) {
            var tool = this.tools && this.tools[id];
            if (tool)
                tool.busy = false;
        },
        isToolEnabled: function(id) {
            return this.tools && this.tools[id] && this.tools[id].enabled;
        },
        showTools: function(tools) {
            this.tools = {};

            if(typeof tools == 'undefined') return;

            for (var i = 0; i < tools.length; i++) {
                var tool = {
                    busy: false,
                    enabled: typeof tools[i].enabled != 'undefined' ? tools[i].enabled : true,
                    source: tools[i]
                };

                // if tool is enabled, check security
                if (tool.enabled && tools[i].security)
                    tool.enabled = App.hasAccessTo(this.expandExpression(tools[i].security));

                this.tools[tools[i].id] = tool;
            }
        }
    });
    */
});