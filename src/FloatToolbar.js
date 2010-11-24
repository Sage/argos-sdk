/// <reference path="../libraries/Simplate.js"/>
/// <reference path="../libraries/reui/reui.js"/>
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-dependencies-debug.js"/>
/// <reference path="../libraries/sdata/sdata-client-debug.js"/>
/// <reference path="Application.js"/>
/// <reference path="Toolbar.js"/>

Ext.namespace("Sage.Platform.Mobile");

(function() {
    Sage.Platform.Mobile.FloatToolbar = Ext.extend(Sage.Platform.Mobile.Toolbar, {
        barTemplate: new Simplate([
            '<div class="toolbar-float {%= $.cls %}" style="visibility: hidden">',
            '<div class="toolbar-float-container">',
            '</div>',
            '</div>'
        ]),
        toolTemplate: new Simplate([
            '<a class="{%= $.cls %}" data-tool-action="{%= $.name %}">',
            '<img src="{%: $.icon %}" />',
            '<span>{%: $.title %}</span>',
            '</a>'
        ]),
        androidFixTemplate: new Simplate([
            '<a href="#" class="android-webkit-fix"></a>'
        ]),   
        constructor: function(o) {
            Sage.Platform.Mobile.MainToolbar.superclass.constructor.apply(this, arguments);

            this.tools = {};
        },
        render: function() {
            Sage.Platform.Mobile.FloatToolbar.superclass.render.call(this);

            this.containerEl = this.el.child('.toolbar-float-container');
        },
        init: function() {            
            this.render();

            if (/android/i.test(navigator.userAgent))
            {
                /*
                 * there is an issue with click "bleed through" on absolutely positioned elements on
                 * android devices which is why we need to go though the trouble of preventing the actual
                 * click event.
                 * see: http://code.google.com/p/android/issues/detail?id=6721
                 */
                var prevent = false;

                this.el.on('touchstart', function(evt, el, o) {
                    prevent = true;

                    var toolActionEl = Ext.fly(el).findParent('[data-tool-action]', this.el, true);
                    if (toolActionEl)
                        this.initiateToolActionFromClick(evt, toolActionEl, o);
                    else
                        this.toggle();
                }, this);
                              
                var handleClick = function(evt) {
                    if (prevent)
                    {
                        if (evt.preventBubble) evt.preventBubble();
                        if (evt.preventDefault) evt.preventDefault();
                        if (evt.stopPropagation) evt.stopPropagation();
                        if (evt.stopImmediatePropagation) evt.stopImmediatePropagation();

                        prevent = false;

                        return false;
                    }
                };

                Ext.getBody().dom.addEventListener('click', handleClick, true); /* capture phase */
            }
            else
            {
                this.el.on('click', function(evt, el, o) {
                    var toolActionEl = Ext.fly(el).findParent('[data-tool-action]', this.el, true);
                    if (toolActionEl)
                        this.initiateToolActionFromClick(evt, toolActionEl, o);
                    else
                        this.toggle();
                }, this);
            }

            Ext.fly(window)
                .on("scroll", this.onBodyScroll, this, {buffer: 125})
                .on("resize", this.onBodyScroll, this, {buffer: 125});
        },
        hasToolAction: function(name, evt, el) {
            return this.tools[name] && this.tools[name].fn;
        },
        invokeToolAction: function(name, evt, el) {
            return this.tools[name].fn.call(this.tool.scope || this);
        },
        open: function() {
            this.el.dom.setAttribute('open', 'open');
        },
        close: function() {
            this.el.dom.removeAttribute('open');
        },
        toggle: function() {
            if (this.el.getAttribute('open') === 'open')
                this.close();
            else
                this.open();
        },
        calculateY: function() {
            var wH = window.innerHeight;
            var sH = Ext.getBody().getScroll().top;
            var eH = this.el.getHeight();

            return (wH + sH) - eH - 8;
        },
        calculateNoVisY: function() {
            var wH = window.innerHeight;
            var sH = Ext.getBody().getScroll().top;

            return wH + sH + 8;
        },
        move: function(y, fx)
        {
            if (Ext.isGecko)
            {
                if (fx === false)
                {
                    this.el.setStyle({
                        'top': String.format('{0}px', y)
                    });
                }
                else
                {
                    this.el.shift({
                        y: y,
                        easing: 'easeBothStrong',
                        duration: .5,
                        stopFx: true,
                        callback: function() {
                            this.el.setStyle({
                                'right': '0px',
                                'left': 'auto'
                            });
                        },
                        scope: this
                    });
                }
            }
            else
            {
                if (fx === false)
                {
                    this.el.setStyle({
                        '-webkit-transition-property': 'none',
                        '-moz-transition-property': 'none',
                        'transition-property': 'none'
                    });
                }
                else
                {
                    this.el.setStyle({
                        '-webkit-transition-property': 'inherit',
                        '-moz-transition-property': 'inherit',
                        'transition-property': 'inherit'
                    });
                }

                this.el.setStyle({
                    '-webkit-transform': String.format('translateY({0}px)', y)
                });
            }
        },
        onBodyScroll: function(evt, el, o)
        {
            this.move(this.calculateY());
        },      
        clear: function() {
            Sage.Platform.Mobile.FloatToolbar.superclass.clear.apply(this, arguments);

            this.el.hide();
            this.containerEl.update('');
        },
        display: function(tools) {
            /* if there are no tools to display, hide this bar */
            /* this toolbar only supports a single action */

            if (this.timer) clearTimeout(this.timer);

            if (tools.length > 0)
            {                
                for (var i = 0; i < tools.length; i++)
                {
                    var tool = this.expandTool(tools[i]);

                    tool.el = Ext.DomHelper.append(this.containerEl, this.toolTemplate.apply(tool), true);

                    this.tools[tool.name] = tool;
                }

                this.timer = (function() {
                    this.move(this.calculateNoVisY(), false);
                    this.el.show();
                    this.move(this.calculateY());
                    this.timer = false;
                }).defer(250, this);
            }
        }
    });
})();
