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

Ext.namespace("Sage.Platform.Mobile");

(function() {
    Sage.Platform.Mobile.MainToolbar = Ext.extend(Sage.Platform.Mobile.Toolbar, {
        barTemplate: new Simplate([
            '<div class="{%= $.cls %} toolbar">',
            '<a id="backButton" class="button headerButton" href="#" style="display: none;">{%: $.backButtonText %}</a>',
            '<h1 id="pageTitle">{%= $.titleText %}</h1>',
            '</div>'
        ]),
        toolTemplate: new Simplate([
            '<a class="button headerButton actionButton {%= $.cls %}" data-tool-action="{%= $.name %}"><span>{%: $.title %}</span></a>'
        ]),
        titleText: 'Mobile',
        backButtonText: '<< Back',
  
        setTitle: function(title) {
            Ext.get('pageTitle').update(title);
        },
        hasToolAction: function(name, evt, el) {
            return this.tool && this.tool.fn;
        },
        invokeToolAction: function(name, evt, el) {
            return this.tool.fn.call(this.tool.scope || this);
        },
        clear: function() {
            Sage.Platform.Mobile.MainToolbar.superclass.clear.apply(this, arguments);

            var el = this.el.child('a[data-tool-action]');
            if (el)
                el.remove();
            
            this.tool = false;
        },
        display: function(tools) {
            /* this toolbar only supports a single action */
            if (tools.length > 0)
            {
                this.tool = this.expandTool(tools[0]);                
                this.tool.el = Ext.DomHelper.append(this.el, this.toolTemplate.apply(this.tool), true);
            }
        }
    });
})();
