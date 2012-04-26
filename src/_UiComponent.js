define('Sage/Platform/Mobile/_UiComponent', [
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/connect',
    'dijit/_WidgetBase',
    'dijit/_Container',
    './_Component'
], function(
    declare,
    array,
    lang,
    connect,
    _WidgetBase,
    _Container,
    _Component
) {
    return declare('Sage.Platform.Mobile._UiComponent', [_Component], {
        _startupComponent: function(instance) {
            if (instance.isInstanceOf(_WidgetBase) && instance._started) return;

            instance.startup();
        },
        _destroyComponent: function(instance) {
            if (instance.isInstanceOf(_WidgetBase) && instance._beingDestroyed) return;

            instance.destroy();
        },
        _attachComponent: function(component, instance, root, owner) {
            this.inherited(arguments);

            if (instance.isInstanceOf(_WidgetBase))
            {
                /* place the component (widget) locally, instead of on the owner like other attachments, since
                 * it is expected that ui components (widgets) exist inside of their defined container.
                 */
                if (this.isInstanceOf(_Container))
                    this.addChild(instance, component.position);
                else if (this.isInstanceOf(_WidgetBase))
                    instance.placeAt(this.containerNode || this.domNode, component.position);
            }
        }
    });
});