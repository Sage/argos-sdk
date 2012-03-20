/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define([
        'dojo/dom-construct',
        'dojo/_base/declare',
        'dojo/query',
        'dojo/parser',
        'dojo/_base/array',
        'dojo/_base/lang',
        'dijit/registry',
        'dijit/_base/wai'
],
function(domConstruct, declare, query, parser, array, lang, registry, wai) {
    // not inheriting from dijit._Templated, but using similar functionality.
    // this is required for contentTemplate to work property.
    var templated = declare('Sage._Templated', null, {
        constructor: function () {
            this._attachPoints = [];
            this._attachEvents = [];
        },
        buildRendering: function () {
            if (this.widgetTemplate && this.contentTemplate) {
                throw new Error('Both "widgetTemplate" and "contentTemplate" cannot be specified at the same time.');
            }
            
            if (this.contentTemplate) {
                this.inherited(arguments);
                var root = domConstruct.toDom(['<div>', this.contentTemplate.apply(this), '</div>'].join(''));
                this._attachTemplateNodes(root);
            } else if (this.widgetTemplate) {
                var root = domConstruct.toDom(this.widgetTemplate.apply(this));
                if (root.nodeType !== 1) {
                    throw new Error('Invalid template.');
                }

                this.domNode = root;
                this._attachTemplateNodes(root);
            } else {
                return;
            }

            if (this.widgetsInTemplate) {
                // Store widgets that we need to start at a later point in time
                var widgetsToAttach = parser.parse(root, {
                    noStart: !this._earlyTemplatedStartup,
                    template: true,          //1.6 addition
                    inherited: {dir: this.dir, lang: this.lang},
                    propsThis: this,         //1.6 addition - so data-dojo-props of widgets in the template can reference "this" to refer to me
                    scope: 'dojo'  //1.6 addition - even in multi-version mode templates use dojoType/data-dojo-type
                });

                this._startupWidgets = this._startupWidgets || [];
                this._startupWidgets = this._startupWidgets.concat(widgetsToAttach);

                this._supportingWidgets = this._supportingWidgets || [];
                this._supportingWidgets = this._supportingWidgets.concat(registry.findWidgets(root));

                this._attachTemplateNodes(widgetsToAttach, function(n, p) {
                    return n[p];
                });
            }

            if (this.contentTemplate) {
                query('> *', root).place(this.domNode);
            } else {
                this._fillContent(this.srcNodeRef);
            }
        },
        _fillContent: function(/*DomNode*/ source){
            // summary:
            //		Relocate source contents to templated container node.
            //		this.containerNode must be able to receive children, or exceptions will be thrown.
            // tags:
            //		protected
            var dest = this.containerNode;
            if (source && dest) {
                while(source.hasChildNodes()){
                    dest.appendChild(source.firstChild);
                }
            }
        },
        _attachTemplateNodes: function(rootNode, getAttrFunc){
            // summary:
            //		Iterate through the template and attach functions and nodes accordingly.
            // description:
            //		Map widget properties and functions to the handlers specified in
            //		the dom node and it's descendants. This function iterates over all
            //		nodes and looks for these properties:
            //			* dojoAttachPoint
            //			* dojoAttachEvent
            //			* waiRole
            //			* waiState
            // rootNode: DomNode|Array[Widgets]
            //		the node to search for properties. All children will be searched.
            // getAttrFunc: Function?
            //		a function which will be used to obtain property for a given
            //		DomNode/Widget
            // tags:
            //		private

            getAttrFunc = getAttrFunc || function (n,p){ return n.getAttribute(p); };

            var nodes = (rootNode instanceof Array) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
            var x = (rootNode instanceof Array) ? 0 : -1;
            for (; x<nodes.length; x++) {
                var baseNode = (x == -1) ? rootNode : nodes[x];
                if(this.widgetsInTemplate && (getAttrFunc(baseNode, "dojoType") || getAttrFunc(baseNode, "data-dojo-type"))){
                    continue;
                }
                // Process dojoAttachPoint
                //var attachPoint = getAttrFunc(baseNode, "dojoAttachPoint");
                var attachPoint = getAttrFunc(baseNode, "dojoAttachPoint") || getAttrFunc(baseNode, "data-dojo-attach-point");
                if (attachPoint) {
                    var point, points = attachPoint.split(/\s*,\s*/);
                    while ((point = points.shift())){
                        if (this[point] instanceof Array) {
                            this[point].push(baseNode);
                        } else {
                            this[point]=baseNode;
                        }
                        
                        this._attachPoints.push(point);
                    }
                }

                // Process dojoAttachEvent
                //var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent");
                var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent") || getAttrFunc(baseNode, "data-dojo-attach-event");
                if (attachEvent) {
                    // NOTE: we want to support attributes that have the form
                    // "domEvent: nativeEvent; ..."
                    var event, events = attachEvent.split(/\s*,\s*/);
                    var trim = lang.trim;
                    while((event = events.shift())){
                        if(event){
                            var thisFunc = null;
                            if(event.indexOf(":") != -1){
                                // oh, if only JS had tuple assignment
                                var funcNameArr = event.split(":");
                                event = trim(funcNameArr[0]);
                                thisFunc = trim(funcNameArr[1]);
                            }else{
                                event = trim(event);
                            }
                            if(!thisFunc){
                                thisFunc = event;
                            }
                            //this.connect(baseNode, event, thisFunc);
                            this._attachEvents.push(this.connect(baseNode, event, thisFunc));
                        }
                    }
                }

                // waiRole, waiState
                // TODO: remove this in 2.0, templates are now using role=... and aria-XXX=... attributes directicly
                var role = getAttrFunc(baseNode, "waiRole");
                if (role) {
                    wai.setWaiRole(baseNode, role);
                }
                
                var values = getAttrFunc(baseNode, "waiState");
                if (values){
                    array.forEach(values.split(/\s*,\s*/), function(stateValue){
                        if(stateValue.indexOf('-') != -1){
                            var pair = stateValue.split('-');
                            wai.setWaiState(baseNode, pair[0], pair[1]);
                        }
                    });
                }
            }
        },
        startup: function(){
            array.forEach(this._startupWidgets, function(w){
                if(w && !w._started && w.startup){
                    w.startup();
                }
            });
            this.inherited(arguments);
        },
        destroyRendering: function(){
            // Delete all attach points to prevent IE6 memory leaks.
            array.forEach(this._attachPoints, function(point) {
                delete this[point];
            }, this);
            this._attachPoints = [];

			// And same for event handlers
			array.forEach(this._attachEvents, this.disconnect, this);
			this._attachEvents = [];

            this.inherited(arguments);
        }

    });

    return templated;
});