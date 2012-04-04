define('Sage/Platform/Mobile/_ComponentContainerMixin', [
        'dojo/dom-construct',
        'dojo/_base/declare',
        'dojo/query',
        'dojo/parser',
        'dojo/_base/array',
        'dojo/_base/lang',
        'dijit/registry',
        'dijit/_base/wai'
], function(
    domConstruct,
    declare,
    query,
    parser,
    array,
    lang,
    registry,
    wai
) {
    return declare('Sage.Platform.Mobile._ComponentWidgetMixin', null, {
        postCreate: function() {
            for (var i = 0; i < this.components.length; i++)
            {
                
            }
        }
    });
});