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
        /**
         * Contains information about `this` component.
         */
        _componentInfo: null,
        _componentRoot: null,
        _componentOwner: null,
        /**
         * Contains information about how, and where, all child components were attached.
         */
        _componentContext: null,

        $: null,
        components: null,

        constructor: function(props) {
            this._components = [];
            this._componentInfo = {};
            this._componentContext = [];

            this.$ = {};
            this.components = [];

            if (props)
            {
                if (props.components) this.components = props.components;

                /* todo: is there a better way to pass this around and still have creation in postscript? */
                /* in case props aren't mixed in by default */
                if (props._componentInfo) this._componentInfo = props._componentInfo;
                if (props._componentRoot) this._componentRoot = props._componentRoot;
                if (props._componentOwner) this._componentOwner = props._componentOwner;
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
                this._detachComponent(instance, context, context.root, context.owner);
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
                    name: name,
                    root: this,
                    owner: this,
                    signals: null
                };

            instance._componentInfo = {name: name};
            instance._componentRoot = this;
            instance._componentOwner = this;

            this._componentContext[slot] = context;

            this._attachComponent(null, instance, context, this, this);
        },
        removeComponent: function(instance) {
            var slot = this._components.indexOf(instance);
            if (slot > -1)
            {
                var context = this._componentContext[slot];

                this._detachComponent(instance, context, context.root, context.owner);

                this._componentContext.splice(slot, 1);
                this._components.splice(slot, 1);
            }
        },
        /**
         * Attaches a child component into the component heirarchy.  The reason the top-down approach is used, instead of
         * a component attaching itself to the heirarchy, is due to the need to support "components" that
         * are not true components, in that they do not inherit from `_Component`.  The primary use case for this is
         * for widgets, so that they may be used as child components, without extra code.
         * @param definition
         * @param instance
         * @param root
         * @param owner
         * @private
         */
        _attachComponent: function(definition, instance, context, root, owner) {
            var componentName = context.name,
                attachPoint = definition && definition.attachPoint,
                attachEvent = definition && definition.attachEvent,
                subscribeEvent = definition && definition.subscribeEvent;

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

                var target = instance.isInstanceOf(_Component)
                        ? instance.getComponentValue()
                        : instance;

                for (var name in attachEvent)
                {
                    context.signals.push(connect.connect(target, name, root, attachEvent[name]));
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
        _detachComponent: function(instance, context, root, owner) {
            var componentName = context.name,
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

                delete context.points;
            }

            if (signals)
            {
                array.forEach(signals, function(signal) {
                    signal.remove();
                });

                delete context.signals;
            }
        },
        _instantiateComponent: function(definition, root, owner) {
            var type = definition.type,
                ctor = lang.isFunction(type) ? type : lang.getObject(type, false);

            if (!ctor) throw new Error('Invalid component type.');

            var props = lang.mixin({
                components: definition.components,
                _componentInfo: {
                    name: definition.name,
                    root: definition.root
                },
                _componentRoot: root,
                _componentOwner: owner
            }, definition.props);

            return new ctor(props);
        },
        _createComponent: function(definition, root, owner) {
            var instance = this._instantiateComponent(definition, root, owner);

            var slot = (this._components.push(instance) - 1),
                context = {
                    name: definition.name,
                    root: root,
                    owner: owner,
                    signals: null
                };

            this._componentContext[slot] = context;

            this._attachComponent(definition, instance, context, root, owner);

            return instance;
        },
        _createComponents: function(definitions, root, owner) {
            if (definitions)
            {
                for (var i = 0; i < definitions.length; i++)
                {
                    this._createComponent(definitions[i], root, owner);
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
        /**
         * The value used when a component is being attached to an instance.
         * @return {*}
         */
        getComponentValue: function() {
            return this;
        },
        getComponentName: function() {
            return this._componentInfo.name;
        },
        getComponents: function() {
            return this._components;
        },
        _preCreateComponents: function(definitions) {
            return definitions;
        },
        initComponents: function() {
            var info = this._componentInfo,
                root = this._componentRoot || this,
                owner = this;

            if (info.root)
            {
                /* create instance components as if they were proto-components */
                this._createComponents(
                    this._preCreateComponents(this.hasOwnProperty('components') && this.components, false),
                    owner, owner
                );
            }
            else
            {
                /* components defined on the prototype are always rooted locally */
                this._createComponents(
                    this._preCreateComponents(this.constructor.prototype.components, true),
                    owner, owner
                );

                /* components defined on the instance always inherit the root */
                this._createComponents(
                    this._preCreateComponents(this.hasOwnProperty('components') && this.components, false),
                    root, owner
                );
            }
        }
    });

    return _Component;
});