define('Sage/Platform/Mobile/_ComponentContainerMixin', [
        'dojo/_base/declare',
        'dojo/_base/array',
        'dojo/_base/lang',
        'dijit/registry',
        './_Component'
], function(
    declare,
    array,
    lang,
    registry,
    _Component
) {
    return declare('Sage.Platform.Mobile._ComponentWidgetMixin', null, {
        constructor: function() {
        },
        postCreate: function() {
            this.inherited();

            this.components = _Component.createComponents(this.components, {owner: this});

            array.forEach(this.components, function(component) {

            }, this);
        }
    });
});