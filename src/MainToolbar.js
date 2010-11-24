/// <reference path="../libraries/Simplate.js"/>
/// <reference path="../libraries/reui/reui.js"/>
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-dependencies-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-debug.js"/>
/// <reference path="Application.js"/>
/// <reference path="Toolbar.js"/>

Ext.namespace("Sage.Platform.Mobile");

(function() {
    Sage.Platform.Mobile.MainToolbar = Ext.extend(Sage.Platform.Mobile.Toolbar, {
        barTemplate: new Simplate([
            '<div class="{%= $.cls %} toolbar">',
            '<a id="backButton" class="button" href="#" style="display: none;">{%: $.backButtonText %}</a>',
            '<h1 id="pageTitle">{%= $.titleText %}</h1>',
            '</div>'
        ]),
        toolTemplate: new Simplate([
            '<a class="{%= $.cls || "button" %} actionButton" data-tool-action="{%= $.name %}"><span>{%: $.title %}</span></a>'
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
