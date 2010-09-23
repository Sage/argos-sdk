/// <reference path="../ext/ext-core-debug.js"/>
/// <reference path="../iui/iui-sage.js"/>
/// <reference path="../Simplate.js"/>
/// <reference path="Application.js"/>

Ext.namespace('Sage.Platform.Mobile');

(function() {
    Sage.Platform.Mobile.View = Ext.extend(Ext.util.Observable, {
        attachmentPoints: {},
        viewTemplate: new Simplate([
            '<ul id="{%= $.id %}" title="{%= $.titleText %}" {% if ($.selected) { %} selected="true" {% } %}>',
            '</ul>'
        ]),
        id: 'generic_view',
        titleText: 'Generic View',
        serviceName: false,
        constructor: function(options) {
            Ext.apply(this, options);

            Sage.Platform.Mobile.View.superclass.constructor.apply(this, arguments);
        },
        render: function() {
            /// <summary>
            ///     Renders the view to the body of the page and stores the rendered element in the 'el' field.
            /// </summary>
            this.el = Ext.DomHelper.append(
                Ext.getBody(),
                this.viewTemplate.apply(this),
                true
            );

            for (var n in this.attachmentPoints)
                if (this.attachmentPoints.hasOwnProperty(n))
                    this[n] = this.el.child(this.attachmentPoints[n]);
        },
        init: function() {
            /// <summary>
            ///     Initializes the view by rendering calling render and binding any applicable events to the
            ///     view's main element.
            /// </summary>
            this.render();
            this.el
                .on('load', this.load, this, {single: true})
                .on('click', this.initiateActionFromClick, this, {delegate: '[data-action]'});

            this.tools = {};
        },
        initiateActionFromClick: function(evt, el, o) {
            var el = Ext.get(el),
                action = el.getAttribute('data-action'),
                parameters = {
                    $event: evt,
                    $source: el
                },
                match;

            if (this.hasAction(action))
            {
                evt.stopEvent();

                for (var i = 0; i < el.dom.attributes.length; i++)
                {
                    var attributeName = el.dom.attributes[i].name;
                    if (/^((?=data-action)|(?!data))/.test(attributeName)) continue;

                    /* transform hyphenated names to pascal case, minus the data segment, to be in line with HTML5 dataset naming conventions */
                    /* see: http://dev.w3.org/html5/spec/elements.html#embedding-custom-non-visible-data */
                    /* todo: remove transformation and use dataset when browser support is there */
                    var parameterName = attributeName.substr('data-'.length).replace(/-(\w)(\w+)/g, function($0, $1, $2) { return $1.toUpperCase() + $2; });

                    parameters[parameterName] = el.getAttribute(attributeName);
                }

                this.invokeAction(action, [parameters, evt, el]);
            }
        },
        hasAction: function(name) {
            return (typeof this[name] === 'function');
        },
        invokeAction: function(name, args) {
            this[name].apply(this, args);
        },
        isActive: function() {
            return (this.el.getAttribute('selected') === 'true');
        },
        setTitle: function(title) {
            /// <summary>
            ///     Sets the title attribute on the view's main element.  This will be used by iUI during transition
            ///     to replace the title in the top bar.
            /// </summary>
            /// <param name="title" type="String">The new title.</param>
            this.el.dom.setAttribute('title', title);
        },
        load: function() {
            /// <summary>
            ///     Called once the first time the view is about to be transitioned to.
            /// </summary>
        },
        refreshRequiredFor: function(options) {
            if (this.options)
            {
                if (options) return true;

                return false;
            }
            else
                return true;
        },
        refresh: function() {
        },
        show: function(options) {
            /// <summary>
            ///     Show's the view using iUI in order to transition to the new element.
            /// </summary>
            if (this.refreshRequiredFor(options))
            {
                this.refreshRequired = true;
                this.options = options || {};
            }

            ReUI.show(this.el.dom);
        },
        beforeTransitionTo: function() {
            /// <summary>
            ///     Called before the view is transitioned (slide animation complete) to.
            /// </summary>
        },
        beforeTransitionAway: function() {
            /// <summary>
            ///     Called before the view is transitioned (slide animation complete) away from.
            /// </summary>
        },
        transitionTo: function() {
            /// <summary>
            ///     Called after the view has been transitioned (slide animation complete) to.
            /// </summary>
            if (this.refreshRequired)
            {
                this.refreshRequired = false;
                this.refresh();
            }
        },
        transitionAway: function() {
            /// <summary>
            ///     Called after the view has been transitioned (slide animation complete) away from.
            /// </summary>
        },
        getService: function() {
            /// <summary>
            ///     Returns the primary SDataService instance for the view.
            /// </summary>
            /// <returns type="Sage.SData.Client.SDataService">The SDataService instance.</returns>
            return App.getService(this.serviceName); /* if false is passed, the default service will be returned */
        },
        getContext: function() {
            return {id: this.id};
        }
    });
})();