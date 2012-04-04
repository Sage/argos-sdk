define('Sage/Platform/Mobile/_TemplatedContentMixin', [
    'dojo/_base/declare',
    'dojo/query',
    'dojo/parser',
    'dijit/registry',
    'dojo/dom-construct'
], function(
    declare,
    query,
    parser,
    registry,
    domConstruct
) {
    return declare('Sage.Platform.Mobile._TemplatedContentMixin', null, {
        contentTemplate: null,
        buildRendering: function() {
            this.inherited();

            if (this.domNode)
            {
                var rendered = this.contentTemplate.apply(this),
                    node = domConstruct.toDom('<div>' + rendered + '</div>');

                if (this._attachTemplateNodes) this._attachTemplateNodes(node);

                this._createContentWidgets(node);

                query('> *', node).place(this.domNode);
            }
        },
        _createContentWidgets: function(node) {
            if(this.widgetsInTemplate)
            {
                var widgetsToAttach = parser.parse(node, {
                    noStart: !this._earlyTemplatedStartup,
                    template: true,
                    inherited: {dir: this.dir, lang: this.lang, textDir: this.textDir},
                    propsThis: this,	// so data-dojo-props of widgets in the template can reference "this" to refer to me
                    scope: "dojo"	// even in multi-version mode templates use dojoType/data-dojo-type
                });

                this._startupWidgets = this._startupWidgets || [];
                this._startupWidgets = this._startupWidgets.concat(widgetsToAttach);

                this._supportingWidgets = this._supportingWidgets || [];
                this._supportingWidgets = this._supportingWidgets.concat(registry.findWidgets(node));

                this._attachTemplateNodes(widgetsToAttach, function(n,p) {
                    return n[p];
                });
            }
        }
    });
});