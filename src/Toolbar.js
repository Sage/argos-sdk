/// <reference path="../libraries/Simplate.js"/>
/// <reference path="../libraries/reui/reui.js"/>
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-dependencies-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-debug.js"/>
/// <reference path="Format.js"/>

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

