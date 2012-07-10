define('Sage/Platform/Mobile/_UiComponent', [
    'require',
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/connect',
    'dojo/dom-construct',
    'dijit/_WidgetBase',
    'dijit/_Container',
    './_Component'
], function(
    require,
    declare,
    array,
    lang,
    connect,
    domConstruct,
    _WidgetBase,
    _Container,
    _Component
) {
    var _UiComponent = declare('Sage.Platform.Mobile._UiComponent', [_Component], {
        _startupChildComponent: function(instance) {
            if (instance.isInstanceOf(_WidgetBase) && instance._started) return;

            instance.startup();
        },
        _destroyChildComponent: function(instance) {
            if (instance.isInstanceOf(_WidgetBase) && instance._beingDestroyed) return;

            instance.destroy();
        },
        _instantiateComponent: function(component, root, owner) {
            if (component.type) return this.inherited(arguments);

            var node = component.content
                    ? domConstruct.toDom(lang.isFunction(component.content) ? component.content.call(root, root, owner, this) : component.content)
                    : domConstruct.create(component.tag, component.attrs),
                props = lang.mixin({
                    components: component.components,
                    _componentRoot: root,
                    _componentOwner: owner,
                    _componentSource: component
                }, component.props);

            return component.domOnly !== false
                ? new DomContentComponent(props, node)
                : new ContentComponent(props, node);
        },
        _attachComponent: function(definition, instance, context, root, owner) {
            this.inherited(arguments);

            this._attachUiComponent(instance, context, definition && definition.position);
        },
        _detachComponent: function(instance, context, root, owner) {
            this.inherited(arguments);

            this._detachUiComponent(instance, context);
        },
        _attachUiComponent: function(instance, context, position) {
            var referenceNode = this.containerNode || this.domNode;

            if (instance.isInstanceOf(_WidgetBase))
            {
                if (this.isInstanceOf(_Container))
                    this.addChild(instance, position);
                else if (referenceNode)
                    instance.placeAt(referenceNode, position);
            }
            else if (instance.domNode)
            {
                domConstruct.place(instance.domNode, referenceNode, position);
            }
        },
        _detachUiComponent: function(instance, context) {
            if (instance.isInstanceOf(_WidgetBase))
            {
                if (this.isInstanceOf(_Container))
                    this.removeChild(instance);
                else if (instance.domNode && instance.domNode.parentNode)
                    instance.domNode.parentNode.removeChild(instance.domNode);
            }
            else if (instance.domNode && instance.domNode.parentNode)
            {
                instance.domNode.parentNode.removeChild(instance.domNode);
            }
        }
    });

    var ContentComponent = declare('Sage.Platform.Mobile.ContentComponent', [_WidgetBase, _UiComponent], {});
    var DomContentComponent = declare('Sage.Platform.Mobile.DomContentComponent', [_UiComponent], {
        domNode: null,
        constructor: function(props, node) {
            lang.mixin(this, props);

            this.domNode = node;
        },
        destroy: function() {
            if (this.domNode)
            {
                if (this.domNode.parentNode)
                    this.domNode.parentNode.removeChild(this.domNode);

                this.domNode = null;
            }

            this.inherited(arguments);
        },
        getComponentValue: function() {
            return this.domNode;
        }
    });

    _UiComponent.ContentComponent = ContentComponent;
    _UiComponent.DomContentComponent = DomContentComponent;

    return _UiComponent;
});