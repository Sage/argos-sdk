define('Sage/Platform/Mobile/_TemplatedMixin', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/query',
    'dojo/parser',
    'dojo/dom-construct',
    'dijit/_TemplatedMixin'
], function(
    declare,
    lang,
    array,
    query,
    parser,
    domConstruct,
    _TemplatedMixin
) {
    return declare('Sage.Platform.Mobile._TemplatedMixin', [_TemplatedMixin], {
        contentTemplate: null,
        widgetTemplate: null,
        buildRendering: function(){
            if (this.widgetTemplate && this.contentTemplate)
            {
                throw new Error('Both "widgetTemplate" and "contentTemplate" cannot be specified at the same time.');
            }

            var node;

            if (this.contentTemplate)
            {
                this.inherited(arguments);
                var root = domConstruct.toDom(['<div>', this.contentTemplate.apply(this), '</div>'].join(''));
                this._attachTemplateNodes(root);
            }
            else if (this.widgetTemplate)
            {
                var root = domConstruct.toDom(this.widgetTemplate.apply(this));

                if (root.nodeType === 11)
                    root = domConstruct.toDom(['<div>', this.widgetTemplate.apply(this), '</div>'].join(''));

                if (root.nodeType !== 1) {
                    throw new Error('Invalid template.');
                }

                this.domNode = root;
                this._attachTemplateNodes(root);
            }
            else
            {
                return;
            }

            this.domNode = node;

            // Call down to _Widget.buildRendering() to get base classes assigned
            // TODO: change the baseClass assignment to _setBaseClassAttr
            this.inherited(arguments);

            // recurse through the node, looking for, and attaching to, our
            // attachment points and events, which should be defined on the template node.
            this._attachTemplateNodes(node, function(n,p){ return n.getAttribute(p); });

            this._beforeFillContent();		// hook for _WidgetsInTemplateMixin

            this._fillContent(this.srcNodeRef);
        }
    });
});