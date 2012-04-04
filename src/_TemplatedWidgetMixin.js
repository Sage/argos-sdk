define('Sage/Platform/Mobile/_TemplatedWidgetMixin', [
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/_TemplatedMixin'
], function(
    declare,
    domConstruct,
    _TemplatedMixin
) {
    return declare('Sage.Platform.Mobile._TemplatedWidgetMixin', null, {
        widgetTemplate: null,
        constructor: function(){
            this._attachPoints = [];
            this._attachEvents = [];
        },
        buildRendering: function() {
            var rendered = this.widgetTemplate.apply(this),
                node = domConstruct.toDom(rendered);

            if (node.nodeType === 11)
                node = domConstruct.toDom('<div>' + rendered + '</div>');

            if (node.nodeType !== 1) throw new Error('Invalid template.');

            this.domNode = node;

            // Call down to _Widget.buildRendering() to get base classes assigned
            // TODO: change the baseClass assignment to _setBaseClassAttr
            this.inherited(arguments);

            // recurse through the node, looking for, and attaching to, our
            // attachment points and events, which should be defined on the template node.
            this._attachTemplateNodes(node, function(n,p){ return n.getAttribute(p); });

            this._beforeFillContent();		// hook for _WidgetsInTemplateMixin

            this._fillContent(this.srcNodeRef);
        },
        /**
         * Since there is no way to directly override only the template rendering in Dojo, include
         * the necessary functions from `_TemplatedMixin` in order to minimize the amount of code that
         * needs to be updated when Dojo itself is updated.
         */
        _beforeFillContent: _TemplatedMixin.prototype._beforeFillContent,
        _fillContent: _TemplatedMixin.prototype._fillContent,
        _attachTemplateNodes: _TemplatedMixin.prototype._attachTemplateNodes,
        destroyRendering: _TemplatedMixin.prototype.destroyRendering
    });
});