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
        attachmentPoints: {
            titleEl: '.toolbar-title'
        },
        barTemplate: new Simplate([
            '<div class="toolbar {%= $.cls %}">',            
            '<h1 id="pageTitle" class="toolbar-title">{%= $.titleText %}</h1>',
            '</div>'
        ]),
        toolTemplate: new Simplate([
            '<button class="button toolButton toolButton-{%= $.side || "right" %} {%= $.cls %}" data-action="invokeTool" data-tool="{%= $.id %}">',
            '{% if ($.icon) { %}',
            '<img src="{%= $.icon %}" alt="{%= $.id %}" />',
            '{% } else { %}',
            '<span>{%: $.title %}</span>', 
            '{% } %}',
            '</button>'
        ]),
        titleText: 'Mobile',
        
        setTitle: function(title) {
            this.titleEl.update(title);
        },
        clear: function() {
            Sage.Platform.Mobile.MainToolbar.superclass.clear.apply(this, arguments);

            this.el.select('[data-action]').remove();
        },
        showTools: function(tools) {
            Sage.Platform.Mobile.MainToolbar.superclass.showTools.apply(this, arguments);

            if (tools)
            {
                for (var i = 0; i < tools.length; i++)
                {
                    Ext.DomHelper.append(this.el, this.toolTemplate.apply(tools[i]));
                }
            }
        }
    });
})();
