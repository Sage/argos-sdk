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

define('Sage/Platform/Mobile/_Templated', ['dojo', 'dijit/_Widget'], function() {

    // not inheriting from dijit._Templated, but using similar functionality.
    // this is required for contentTemplate to work property.
    return dojo.declare('Sage.Platform.Mobile._Templated', null, {
        constructor: function() {
            this._attachPoints = [];
            this._attachEvents = [];
        },
        buildRendering: function()
        {
            if (this.widgetTemplate && this.contentTemplate)
                throw new Error('Both "widgetTemplate" and "contentTemplate" cannot be specified at the same time.');

            if (this.contentTemplate)
            {
                this.inherited(arguments);

                var root = dojo._toDom(['<div>', this.contentTemplate.apply(this), '</div>'].join(''))
            }
            else if (this.widgetTemplate)
            {
                var root = dojo._toDom(this.widgetTemplate.apply(this));

                if (root.nodeType === 11)
                    root = dojo._toDom(['<div>', this.widgetTemplate.apply(this), '</div>'].join(''));

                if (root.nodeType !== 1)
                    throw new Error('Invalid template. Node type is: '+root.nodeType);

                this.domNode = root;

                this._attachTemplateNodes(root);
            }
            else
            {
                return;
            }

            if (this.widgetsInTemplate) {
////                // Make sure dojoType is used for parsing widgets in template.
////                // The dojo.parser.query could be changed from multiversion support.
////                var parser = dojo.parser, qry, attr;
////                if(parser._query != "[dojoType]"){
////                    qry = parser._query;
////                    attr = parser._attrName;
////                    parser._query = "[dojoType]";
////                    parser._attrName = "dojoType";
////                }

                // Store widgets that we need to start at a later point in time
                var widgetsToAttach = dojo.parser.parse(root, {
                    noStart: !this._earlyTemplatedStartup,
                    template: true,          //1.6 addition
                    inherited: {dir: this.dir, lang: this.lang},
                    propsThis: this,         //1.6 addition - so data-dojo-props of widgets in the template can reference "this" to refer to me
                    scope: 'dojo'  //1.6 addition - even in multi-version mode templates use dojoType/data-dojo-type
                });

                this._startupWidgets = this._startupWidgets || [];
                this._startupWidgets = this._startupWidgets.concat(widgetsToAttach);

////                // Restore the query.
////                if (qry) {
////                    parser._query = qry;
////                    parser._attrName = attr;
////                }

                this._supportingWidgets = this._supportingWidgets || [];
                this._supportingWidgets = this._supportingWidgets.concat(dijit.findWidgets(root));

                this._attachTemplateNodes(widgetsToAttach, function(n, p) {
                    return n[p];
                });
            }

            if (this.contentTemplate)
                dojo.query('> *', root).place(this.domNode);
            else
                this._fillContent(this.srcNodeRef);

        },
        _fillContent: function(/*DomNode*/ source){
            // summary:
            //		Relocate source contents to templated container node.
            //		this.containerNode must be able to receive children, or exceptions will be thrown.
            // tags:
            //		protected
            var dest = this.containerNode;
            if(source && dest){
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
            //			* data-dojo-attach-point
            //			* data-dojo-attach-event
            //			* waiRole
            //			* waiState
            // rootNode: DomNode|Array[Widgets]
            //		the node to search for properties. All children will be searched.
            // getAttrFunc: Function?
            //		a function which will be used to obtain property for a given
            //		DomNode/Widget
            // tags:
            //		private

            getAttrFunc = getAttrFunc || function(n,p){ return n.getAttribute(p); };

            var nodes = dojo.isArray(rootNode) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
            var x = dojo.isArray(rootNode) ? 0 : -1;
            for(; x<nodes.length; x++){
                var baseNode = (x == -1) ? rootNode : nodes[x];
                //if(this.widgetsInTemplate && getAttrFunc(baseNode, "dojoType")){
                if(this.widgetsInTemplate && (getAttrFunc(baseNode, "dojoType") || getAttrFunc(baseNode, "data-dojo-type"))){
                    continue;
                }
                // Process data-dojo-attach-point
                //var attachPoint = getAttrFunc(baseNode, "data-dojo-attach-point");
                var attachPoint = getAttrFunc(baseNode, "dojoAttachPoint") || getAttrFunc(baseNode, "data-dojo-attach-point");
                if(attachPoint){
                    var point, points = attachPoint.split(/\s*,\s*/);
                    while((point = points.shift())){
                        if(dojo.isArray(this[point])){
                            this[point].push(baseNode);
                        }else{
                            this[point]=baseNode;
                        }
                        this._attachPoints.push(point);
                    }
                }

                // Process data-dojo-attach-event
                //var attachEvent = getAttrFunc(baseNode, "data-dojo-attach-event");
                var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent") || getAttrFunc(baseNode, "data-dojo-attach-event");
                if(attachEvent){
                    // NOTE: we want to support attributes that have the form
                    // "domEvent: nativeEvent; ..."
                    var event, events = attachEvent.split(/\s*,\s*/);
                    var trim = dojo.trim;
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
                if(role){
                    dijit.setWaiRole(baseNode, role);
                }
                var values = getAttrFunc(baseNode, "waiState");
                if(values){
                    dojo.forEach(values.split(/\s*,\s*/), function(stateValue){
                        if(stateValue.indexOf('-') != -1){
                            var pair = stateValue.split('-');
                            dijit.setWaiState(baseNode, pair[0], pair[1]);
                        }
                    });
                }
            }
        },
        startup: function(){
            dojo.forEach(this._startupWidgets, function(w){
                if(w && !w._started && w.startup){
                    w.startup();
                }
            });
            this.inherited(arguments);
        },
        destroyRendering: function(){
            // Delete all attach points to prevent IE6 memory leaks.
            dojo.forEach(this._attachPoints, function(point){
                delete this[point];
            }, this);
            this._attachPoints = [];

			// And same for event handlers
			dojo.forEach(this._attachEvents, this.disconnect, this);
			this._attachEvents = [];

            this.inherited(arguments);
        }
    });
});
