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

define('Sage/Platform/Mobile/MainToolbar', ['Sage/Platform/Mobile/Toolbar'], function() {

    return dojo.declare('Sage.Platform.Mobile.MainToolbar', [Sage.Platform.Mobile.Toolbar], {
        attributeMap: {
            'title': {
                node: 'titleNode',
                type: 'innerHTML'
            }
        },
        widgetTemplate: new Simplate([
            '<div class="toolbar {%= $.cls %}">',            
            '<h1 id="pageTitle" class="toolbar-title" data-dojo-attach-point="titleNode">{%= $.titleText %}</h1>',
            '</div>'
        ]),
        toolTemplate: new Simplate([
            '<button class="button toolButton toolButton-{%= $.side || "right" %} {%= ($$.enabled) ? "" : "toolButton-disabled" %} {%= $.cls %}"',
                    'data-action="invokeTool" data-tool="{%= $.id %}"',
                    'aria-label="{%: $.title || $.id %}">',
                '{% if ($.icon) { %}',
                '<img src="{%= $.icon %}" alt="{%= $.id %}" />',
                '{% } else { %}',
                '<span></span>',
                '{% } %}',
            '</button>'
        ]),
        size: 0,

        titleText: 'Mobile',
        
        clear: function() {
            this.inherited(arguments);

            dojo.query("> [data-action], .toolButton-right", this.domNode).remove();
        },
        showTools: function(tools) {
            this.inherited(arguments);

            dojo.removeClass(this.domNode, 'toolbar-size-' + this.size);
            
            if (tools)
            {
                var count = {left: 0, right: 0};

                for (var i = 0; i < tools.length; i++)
                {
                    count[tools[i].side || 'right'] += 1;
                    var toolTemplate = tools[i].template || this.toolTemplate;

                    dojo.query(this.domNode).append(toolTemplate.apply(tools[i], this.tools[tools[i].id]));
                }

                this.size = Math.max(count.left, count.right);
                dojo.addClass(this.domNode, 'toolbar-size-' + this.size);
            }
        }
    });
});