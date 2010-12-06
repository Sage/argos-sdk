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
        barTemplate: new Simplate([
            '<div class="{%= $.cls %}">',            
            '</div>'
        ]),        
        busy: false,
        constructor: function(options) {
            Sage.Platform.Mobile.Toolbar.superclass.constructor.apply(this, arguments);

            Ext.apply(this, options);
        },
        init: function() {
            this.render();
            
            this.el.on('click', this.initiateToolActionFromClick, this, {delegate: '[data-tool-action]'}); 
        },
        render: function() {
            this.el = Ext.DomHelper.append(
                Ext.getBody(),
                this.barTemplate.apply(this),
                true
            );
        },
        initiateToolActionFromClick: function(evt, el, o) {
            var el = Ext.get(el),
                action = el.getAttribute('data-tool-action');

            if (this.busy) return;
           
            if (this.hasToolAction(action, evt, el))
            {
                evt.stopEvent();

                this.invokeToolAction(action, evt, el);
            }
        },
        hasToolAction: function(name, evt, el) {
            return false;
        },
        invokeToolAction: function(name, evt, el) {
            return false;
        },
        clear: function() {
            this.busy = false;
        },
        show: function() {
            this.el.show();
        },
        hide: function() {
            this.el.hide();
        },
        disable: function() {
            this.el.addClass('busy');
            this.busy = true;
        },
        enable: function() {
            this.el.removeClass('busy');
            this.busy = false;
        },
        expandExpression: function(expression, scope) {
            if (typeof expression === 'function')
                return expression.call(scope || this);
            else
                return expression;
        },        
        expandTool: function(tool) {
            var expanded = {};

            for (var n in tool)
                if (tool.hasOwnProperty(n))
                    expanded[n] = n !== 'fn' ? this.expandExpression(tool[n], tool.scope) : tool[n];
            
            return expanded;
        },
        display: function(tools) {
        }
    });
})();

