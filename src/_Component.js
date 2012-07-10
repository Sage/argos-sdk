define('Sage/Platform/Mobile/_Component', [
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/connect'
], function(
    declare,
    array,
    lang,
    connect
) {
    var parse = function(value) {
        var segments = value.split(/\s*,\s*/),
            map = {};

        array.forEach(segments, function(segment) {
            var pair = segment.split(':'),
                event = lang.trim(pair[0]);

            this[event] = pair[1] ? lang.trim(pair[1]) : event;
        }, map);

        return map;
    };

    var _Component = declare('Sage.Platform.Mobile._Component', null, {
        _components: null,
        _componentRoot: null,
        _componentOwner: null,
        _componentContext: null,
        $: null,
        components: null,
        constructor: function(props) {
            this._components = [];
            this._componentContext = [];
            this._componentSource = {};

            this.$ = {};
            this.components = [];

            if (props)
            {
                if (props.components) this.components = props.components;

                /* todo: is there a better way to pass this around and still have creation in postscript? */
                /* in case props aren't mixed in by default */
                if (props._componentRoot) this._componentRoot = props._componentRoot;
                if (props._componentOwner) this._componentOwner = props._componentOwner;
                if (props._componentSource) this._componentSource = props._componentSource;
            }
        },
        postscript: function() {
            this.inherited(arguments);
            this.onCreate();
            this.initComponents();
        },
        startup: function() {
            this.inherited(arguments);

            this.onStartup();

            array.forEach(this._components, function(instance, slot) {
                this._startupChildComponent(instance);
            }, this);
        },
        destroy: function() {
            this.inherited(arguments);

            this.onDestroy();

            if (this._componentOwner)
                this._componentOwner.removeComponent(this);

            array.forEach(this._components, function(instance, slot) {
                var context = this._componentContext[slot];
                this._handleComponentRemoval(instance, context);
                this._destroyChildComponent(instance);
            }, this);

            this.$ = null;
            this._components = null;
            this._componentContext = null;
        },
        _startupChildComponent: function(instance) {
            if (typeof instance.startup === 'function') instance.startup();
        },
        _destroyChildComponent: function(instance) {
            if (typeof instance.destroy === 'function') instance.destroy();
        },
        addComponent: function(name, instance) {
            if (instance._componentOwner) return;

            var slot = (this._components.push(instance) - 1),
                context = {
                    remote: true
                },
                source = instance._componentSource;

            source.name = name;

            this._componentContext[slot] = context;

            this._attachRemoteComponent(instance, context, this);
        },
        removeComponent: function(instance) {
            var slot = this._components.indexOf(instance);
            if (slot > -1)
            {
                var context = this._componentContext[slot];

                this._handleComponentRemoval(instance, context);

                this._componentContext.splice(slot, 1);
                this._components.splice(slot, 1);
            }
        },
        _handleComponentRemoval: function(instance, context) {
            if (context)
            {
                /* todo: should _componentOwner and _componentRoot be tracked by the context? */
                if (context.remote)
                    this._detachRemoteComponent(instance, context, instance._componentOwner);
                else
                    this._detachLocalComponent(instance, context, instance._componentRoot, instance._componentOwner);

                instance._componentRemoved = true;
            }
        },
        _attachRemoteComponent: function(instance, context, owner) {
            var component = instance._componentSource,
                componentName = context.componentName = component && component.name;

            instance._componentRoot = owner;
            instance._componentOwner = owner;

            if (componentName)
            {
                if (owner.$[componentName]) throw new Error('A component with the same name already exists.');

                owner.$[componentName] = instance;
            }
        },
        _detachRemoteComponent: function(instance, context, owner) {
            var componentName = context.componentName;

            instance._componentRoot = null;
            instance._componentOwner = null;

            if (componentName)
            {
                if (owner.$[componentName]) throw new Error('A component with the same name already exists.');

                delete owner.$[componentName];
            }
        },
        /**
         * Attaches a child component into the component heirarchy.  The reason the top-down approach is used, instead of
         * a component attaching itself to the heirarchy, is due to the need to support "components" that
         * are not true components, in that they do not inherit from `_Component`.  The primary use case for this is
         * for widgets, so that they may be used as child components, without extra code.
         * @param component
         * @param instance
         * @param root
         * @param owner
         * @private
         */
        _attachLocalComponent: function(component, instance, context, root, owner) {
            var componentName = context.componentName = component.name,
                attachPoint = component.attachPoint,
                attachEvent = component.attachEvent,
                subscribeEvent = component.subscribeEvent;

            if (componentName)
            {
                if (owner.$[componentName] || root.$[componentName]) throw new Error('A component with the same name already exists.');

                owner.$[componentName] = root.$[componentName] = instance;
            }

            if (attachPoint)
            {
                var value = instance.isInstanceOf(_Component)
                        ? instance.getComponentValue()
                        : instance,
                    points = context.points = attachPoint.split(/\s*,\s*/);

                for (var i = 0; i < points.length; i++)
                {
                    var point = points[i];

                    if (lang.getObject(point, false, root)) throw new Error('Attach point already occupied.');

                    lang.setObject(point, value, root);
                }
            }

            if (attachEvent && lang.isString(attachEvent))
                attachEvent = parse(attachEvent);

            if (attachEvent)
            {
                /* this component is responsible for the connection */
                context.signals = (context.signals || []);

                for (var name in attachEvent)
                {
                    context.signals.push(connect.connect(instance, name, root, attachEvent[name]));
                }
            }

            if (subscribeEvent && lang.isString(subscribeEvent))
                subscribeEvent = parse(subscribeEvent);

            if (subscribeEvent)
            {
                /* this component is responsible for the connection */
                context.signals = (context.signals || []);

                for (var name in subscribeEvent)
                {
                    context.signals.push(connect.connect(root, name, instance, subscribeEvent[name]));
                }
            }
        },
        _detachLocalComponent: function(instance, context, root, owner) {
            var componentName = context.componentName,
                points = context.points,
                signals = context.signals;

            instance._componentRoot = null;
            instance._componentOwner = null;

            if (componentName)
            {
                delete owner.$[componentName];
                delete root.$[componentName];
            }

            if (points)
            {
                for (var i = 0; i < points.length; i++)
                {
                    var point = points[i];

                    lang.setObject(point, null, root);
                }
            }

            if (signals)
            {
                array.forEach(signals, function(signal) {
                    signal.remove();
                });
            }
        },
        _instantiateComponent: function(component, root, owner) {
            var type = component.type,
                ctor = lang.isFunction(type) ? type : lang.getObject(type, false);

            if (!ctor) throw new Error('Invalid component type.');

            var props = lang.mixin({
                components: component.components,
                _componentRoot: root,
                _componentOwner: owner,
                _componentSource: component
            }, component.props);

            return new ctor(props);
        },
        _createComponent: function(component, root, owner) {
            var instance = this._instantiateComponent(component, root, owner);

            var slot = (this._components.push(instance) - 1),
                context = {
                    remote: false,
                    signals: null
                };

            this._componentContext[slot] = context;

            this._attachLocalComponent(component, instance, context, root, owner);

            return instance;
        },
        _createComponents: function(components, root, owner) {
            if (components)
            {
                for (var i = 0; i < components.length; i++)
                {
                    this._createComponent(components[i], root, owner);
                }
            }
        },
        onCreate: function() {
        },
        onStartup: function() {
        },
        onDestroy: function() {
        },
        getComponentRoot: function() {
            return this._componentRoot || this;
        },
        getComponentOwner: function() {
            return this._componentOwner || this;
        },
        getComponentValue: function() {
            return this;
        },
        getComponentName: function() {
            return this._componentSource.name;
        },
        getComponents: function() {
            return this._components;
        },
        _modifyComponentDeclarations: function(components) {
            return components;
        },
        _getProtoComponentDeclarations: function() {
            return this.constructor.prototype.components;
        },
        _getInstanceComponentDeclarations: function() {
            return this.hasOwnProperty('components') && this.components;
        },
        initComponents: function() {
            var source = this._componentSource,
                root = this._componentRoot || this,
                owner = this;

            if (source.root)
            {
                /* create instance components as if they were proto-components */
                this._createComponents(
                    this._modifyComponentDeclarations(this.hasOwnProperty('components') && this.components),
                    owner, owner
                );
            }
            else
            {
                /* components defined on the prototype are always rooted locally */
                this._createComponents(
                    this._modifyComponentDeclarations(this.constructor.prototype.components),
                    owner, owner
                );

                /* components defined on the instance always inherit the root */
                this._createComponents(
                    this._modifyComponentDeclarations(this.hasOwnProperty('components') && this.components),
                    root, owner
                );
            }
        }
    });

    return _Component;
});