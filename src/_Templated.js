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

define('Sage/Platform/Mobile/_Templated',
    [
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
    /**
     * _Templated serves as an override for dijit Widgets to enable the use of
     * Simplates for templates as well as fixing a few incompatabilities.
     *
     * @alternateClassName _Templated
     */
    var templated = declare('Sage.Platform.Mobile._Templated', null, {
        /*
         * Not inheriting from dijit._Templated, but using similar functionality.
         * this is required for contentTemplate to work property.
         */

        /**
         * Initializes _attachPoints and _attachEvents
         */
        constructor: function () {
            this._attachPoints = [];
            this._attachEvents = [];
        },
        /**
         * Processes `this.widgetTemplate` or `this.contentTemplate`
         */
        buildRendering: function () {
            if (this.widgetTemplate && this.contentTemplate)
            {
                throw new Error('Both "widgetTemplate" and "contentTemplate" cannot be specified at the same time.');
            }
            
            if (this.contentTemplate)
            {
                this.inherited(arguments);
                var root = domConstruct.toDom(['<div>', this.contentTemplate.apply(this), '</div>'].join(''));
                this._attachTemplateNodes(root);
            } else if (this.widgetTemplate)
            {
                var root = domConstruct.toDom(this.widgetTemplate.apply(this));

                if (root.nodeType === 11)
                    root = domConstruct.toDom(['<div>', this.widgetTemplate.apply(this), '</div>'].join(''));

                if (root.nodeType !== 1)
                {
                    throw new Error('Invalid template.');
                }

                this.domNode = root;
                this._attachTemplateNodes(root);
            }
            else
            {
                return;
            }

            if (this.widgetsInTemplate)
            {
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

            if (this.contentTemplate)
            {
                query('> *', root).place(this.domNode);
            } else
            {
                this._fillContent(this.srcNodeRef);
            }
        },
        /**
         * Relocate source contents to templated container node.
         *
         * this.containerNode must be able to receive children, or exceptions will be thrown.
         * @param {HTMLElement} source
         * @protected
         */
        _fillContent: function(source) {
            var dest = this.containerNode;
            if (source && dest)
            {
                while (source.hasChildNodes())
                {
                    dest.appendChild(source.firstChild);
                }
            }
        },
        /**
         * Iterate through the template and attach functions and nodes accordingly.
         *
         * Map widget properties and functions to the handlers specified in
         * the dom node and it's descendants. This function iterates over all
         * nodes and looks for these properties:
         *
         * * dojoAttachPoint
         * * dojoAttachEvent
         * * waiRole
         * * waiState
         *
         * @param {HTMLElement/Object[]} rootNode The node to search for properties. All children will be searched.
         * @param getAttrFunc {Function} A function which will be used to obtain property for a given DomNode/Widget
         */
        _attachTemplateNodes: function(rootNode, getAttrFunc) {
            getAttrFunc = getAttrFunc || function (n,p){ return n.getAttribute(p); };

            var nodes = (rootNode instanceof Array) ? rootNode : (rootNode.all || rootNode.getElementsByTagName("*"));
            var x = (rootNode instanceof Array) ? 0 : -1;
            for (; x<nodes.length; x++)
            {
                var baseNode = (x == -1) ? rootNode : nodes[x];
                if (this.widgetsInTemplate && (getAttrFunc(baseNode, "dojoType") || getAttrFunc(baseNode, "data-dojo-type")))
                {
                    continue;
                }
                // Process dojoAttachPoint
                //var attachPoint = getAttrFunc(baseNode, "dojoAttachPoint");
                var attachPoint = getAttrFunc(baseNode, "dojoAttachPoint") || getAttrFunc(baseNode, "data-dojo-attach-point");
                if (attachPoint)
                {
                    var point, points = attachPoint.split(/\s*,\s*/);
                    while ((point = points.shift()))
                    {
                        if (this[point] instanceof Array)
                        {
                            this[point].push(baseNode);
                        }
                        else
                        {
                            this[point]=baseNode;
                        }
                        
                        this._attachPoints.push(point);
                    }
                }

                // Process dojoAttachEvent
                //var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent");
                var attachEvent = getAttrFunc(baseNode, "dojoAttachEvent") || getAttrFunc(baseNode, "data-dojo-attach-event");
                if (attachEvent)
                {
                    // NOTE: we want to support attributes that have the form
                    // "domEvent: nativeEvent; ..."
                    var event, events = attachEvent.split(/\s*,\s*/);
                    var trim = lang.trim;
                    while ((event = events.shift()))
                    {
                        if (event)
                        {
                            var thisFunc = null;
                            if (event.indexOf(":") != -1)
                            {
                                // oh, if only JS had tuple assignment
                                var funcNameArr = event.split(":");
                                event = trim(funcNameArr[0]);
                                thisFunc = trim(funcNameArr[1]);
                            }
                            else
                            {
                                event = trim(event);
                            }

                            if (!thisFunc)
                            {
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
                if (role)
                {
                    wai.setWaiRole(baseNode, role);
                }
                
                var values = getAttrFunc(baseNode, "waiState");
                if (values)
                {
                    array.forEach(values.split(/\s*,\s*/), function(stateValue) {
                        if (stateValue.indexOf('-') != -1)
                        {
                            var pair = stateValue.split('-');
                            wai.setWaiState(baseNode, pair[0], pair[1]);
                        }
                    });
                }
            }
        },
        /**
         * Extends the parent implementation by also calling startup on any attached widgets
         */
        startup: function() {
            array.forEach(this._startupWidgets, function(w){
                if (w && !w._started && w.startup)
                {
                    w.startup();
                }
            });
            this.inherited(arguments);
        },
        /**
         * Extends the parent implementation by also destroying _attachPoints and disconnecting _attachEvents
         */
        destroyRendering: function() {
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