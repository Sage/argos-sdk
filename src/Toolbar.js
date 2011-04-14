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
    Sage.Platform.Mobile.Toolbar = Ext.extend(Ext.util.Observable, {
        attachmentPoints: {},
        enabled: true,
        managed: true,
        barTemplate: new Simplate([
            '<div class="toolbar">',            
            '</div>'
        ]), 
        constructor: function(options) {
            Sage.Platform.Mobile.Toolbar.superclass.constructor.apply(this, arguments);

            Ext.apply(this, options);
        },
        expandExpression: function(expression, scope) {
            if (typeof expression === 'function')
                return expression.call(scope || this);
            else
                return expression;
        },
        init: function() {
            this.render();

            this.el.setVisibilityMode(Ext.Element.DISPLAY);
            this.el.on('click', this.initiateActionFromClick, this, {delegate: '[data-action]'}); 
        },
        render: function() {
            this.el = Ext.DomHelper.insertFirst(
                Ext.getBody(),
                this.barTemplate.apply(this),
                true
            );

            for (var n in this.attachmentPoints)
                if (this.attachmentPoints.hasOwnProperty(n))
                    this[n] = this.el.child(this.attachmentPoints[n]);
        },        
        // todo: mixin action support
        getParametersForAction: function(name, evt, el) {
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
        initiateActionFromClick: function(evt, el) {
            var el = Ext.get(el),
                action = el.getAttribute('data-action');

            if (this.hasAction(action, evt, el))
            {
                var parameters = this.getParametersForAction(action, evt, el);

                this.invokeAction(action, parameters, evt, el);
            }
        },
        hasAction: function(name, evt, el) {
            return (typeof this[name] === 'function');
        },
        invokeAction: function(name, parameters, evt, el) {
            return this[name].apply(this, [parameters, evt, el]);
        },     
        invokeTool: function(parameters, evt, el) {
            var id = parameters && parameters.tool,
                tool = this.tools && this.tools[id],
                source = tool && tool.source;
            if (source)
            {
                if (source.fn)
                {
                    source.fn.call(source.scope || this, source);
                }
                else if (source.action)
                {
                    var view = App.getActiveView();
                    if (view && view.hasAction(source.action))
                        view.invokeAction(source.action, Ext.apply(parameters, {'$tool': source}), evt, el);
                }
            }
        },
        show: function() {
            this.el.show();
        },
        hide: function() {
            this.el.hide();
        },
        clear: function() {
            this.tools = {};
            this.el.removeClass('toolbar-disabled');
            this.enabled = true;
        },
        enable: function() {
            this.el.removeClass('toolbar-disabled');
            this.enabled = true;
        },
        disable: function() {
            this.el.addClass('toolbar-disabled');
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

            for (var i = 0; i < tools.length; i++)
                this.tools[tools[i].id] = {
                    busy: false,
                    enabled: true,
                    source: tools[i]
                };
        }
    });
})();

