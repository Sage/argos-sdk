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
            var content = component.content,
                tag = component.tag;

            if (content || tag)
            {
                var node = content
                        ? domConstruct.toDom(lang.isFunction(content) ? content.call(this, this) : content)
                        : domConstruct.create(component.tag, component.attrs),
                    props = lang.mixin({
                        components: component.components,
                        _componentRoot: root,
                        _componentOwner: owner
                    }, component.props);

                return component.domOnly !== false
                    ? new DomContentComponent(props, node)
                    : new ContentComponent(props, node);
            }

            return this.inherited(arguments);
        },
        _attachRemoteComponent: function(instance, context, owner) {
            this.inherited(arguments);

            this._attachUiComponent(instance, context);
        },
        _detachRemoteComponent: function(instance, context, owner) {
            this.inherited(arguments);

            this._detachUiComponent(instance, context);
        },
        _attachLocalComponent: function(component, instance, context, root, owner) {
            this.inherited(arguments);

            this._attachUiComponent(instance, context, component.position);
        },
        _detachLocalComponent: function(instance, context, root, owner) {
            this.inherited(arguments);

            this._detachUiComponent(instance, context);
        },
        _attachUiComponent: function(instance, context, position) {
            if (instance.isInstanceOf(_WidgetBase))
            {
                /* place the component (widget) locally, instead of on the owner like other attachments, since
                 * it is expected that ui components (widgets) exist inside of their defined container.
                 */
                if (this.isInstanceOf(_Container))
                    this.addChild(instance, position);
                else if (this.isInstanceOf(_WidgetBase))
                    instance.placeAt(this.containerNode || this.domNode, position);
            }
            else if (instance.isInstanceOf(DomContentComponent))
            {
                if (this.isInstanceOf(_WidgetBase))
                    domConstruct.place(instance.domNode, this.containerNode || this.domNode, position);
                else if (this.isInstanceOf(DomContentComponent))
                    domConstruct.place(instance.domNode, this.containerNode || this.domNode, position);
            }
        },
        _detachUiComponent: function(instance, context) {
            //node.parentNode.removeChild(node);
            if (instance.isInstanceOf(_WidgetBase))
            {
                if (this.isInstanceOf(_Container))
                    this.removeChild(instance);
                else if (instance.domNode && instance.domNode.parentNode)
                    instance.domNode.parentNode.removeChild(instance.domNode);
            }
            else if (instance.isInstanceOf(DomContentComponent))
            {
                if (instance.domNode && instance.domNode.parentNode)
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