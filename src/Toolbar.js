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

define('Sage/Platform/Mobile/Toolbar', ['dojo', 'dojo/string', 'dojo/NodeList-manipulate', 'dojo/NodeList-traverse', 'dijit/_Widget', 'Sage/Platform/Mobile/_ActionMixin', 'Sage/Platform/Mobile/_Templated'], function() {

    return dojo.declare('Sage.Platform.Mobile.Toolbar', [dijit._Widget, Sage.Platform.Mobile._ActionMixin, Sage.Platform.Mobile._Templated], {
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
            this.startup();
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
                        view.invokeAction(source.action, dojo.mixin(parameters, {'$tool': source}), evt, el);
                }
            }
        },
        show: function() {
            dojo.style(this.domNode, "display", "block");
        },
        hide: function() {
            dojo.style(this.domNode, "display", "none");
        },
        clear: function() {
            this.tools = {};
            dojo.removeClass(this.domNode, 'toolbar-disabled');
            this.enabled = true;
        },
        enable: function() {
            dojo.removeClass(this.domNode, 'toolbar-disabled');
            this.enabled = true;
        },
        disable: function() {
            dojo.addClass(this.domNode, 'toolbar-disabled');
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
});