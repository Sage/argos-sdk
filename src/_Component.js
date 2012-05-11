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
        _componentSignals: null,
        components: null,
        constructor: function(props) {
            this.$ = {};

            if (props)
            {
                if (props.components) this.components = props.components;
                /* todo: is there a better way to pass this around and still have creation in postscript? */
                if (props._componentRoot) this._componentRoot = props._componentRoot;
                if (props._componentOwner) this._componentOwner = props._componentOwner;

                delete props.components;
                delete props._componentRoot;
                delete props._componentOwner;
            }
        },
        postscript: function() {
            this.inherited(arguments);
            this.initComponents();
        },
        startup: function() {
            this.inherited(arguments);

            this.onStartup();

            array.forEach(this._components, function(component) {
                this._startupChildComponent(component);
            }, this);
        },
        destroy: function() {
            array.forEach(this._componentSignals, function(signal) {
                signal.remove();
            });
            this._componentSignals = null;

            this.inherited(arguments);

            this.onDestroy();

            array.forEach(this._components, function(component) {
                this._destroyChildComponent(component);
            }, this);

            this.$ = null;
            this._components = null;
        },
        _startupChildComponent: function(instance) {
            instance.startup();
        },
        _destroyChildComponent: function(instance) {
            instance.destroy();
        },
        _attachComponent: function(component, instance, root, owner) {
            var target = root,
                componentName = component.name,
                attachPoint = component.attachPoint,
                attachEvent = component.attachEvent,
                subscribeEvent = component.subscribeEvent;

            if (componentName)
            {
                if (owner.$[componentName]) throw new Error('A component with the same name already exists.');

                owner.$[componentName] = target.$[componentName] = instance;
            }

            if (attachPoint)
            {
                var value = instance.getComponentValue(),
                    points = attachPoint.split(/\s*,\s*/);

                for (var i = 0; i < points.length; i++)
                {
                    var point = points[i];

                    if (lang.getObject(point, false, target)) throw new Error('Attach point already occupied.');

                    lang.setObject(point, value, target);
                }
            }

            if (attachEvent && lang.isString(attachEvent))
                attachEvent = parse(attachEvent);

            if (attachEvent)
            {
                /* this component is responsible for the connection */
                this._componentSignals = (this._componentSignals || []);

                for (var name in attachEvent)
                {
                    this._componentSignals.push(connect.connect(instance, name, target, attachEvent[name]));
                }
            }

            if (subscribeEvent && lang.isString(subscribeEvent))
                subscribeEvent = parse(subscribeEvent);

            if (subscribeEvent)
            {
                /* this component is responsible for the connection */
                this._componentSignals = (this._componentSignals || []);

                for (var name in subscribeEvent)
                {
                    this._componentSignals.push(connect.connect(target, name, instance, subscribeEvent[name]));
                }
            }
        },
        _instantiateComponent: function(component, root, owner) {
            var type = component.type,
                ctor = lang.isFunction(type) ? type : lang.getObject(type, false);

            if (!ctor) throw new Error('Invalid component type.');

            var props = lang.mixin({
                components: component.components,
                _componentRoot: root,
                _componentOwner: owner
            }, component.props);

            return new ctor(props);
        },
        _createComponent: function(component, root, owner) {
            var instance = this._instantiateComponent(component, root, owner);

            this._attachComponent(component, instance, root, owner);

            return instance;
        },
        _createComponents: function(components, root, owner) {
            var created = [];

            if (components)
            {
                for (var i = 0; i < components.length; i++)
                {
                    created.push(this._createComponent(components[i], root, owner));
                }
            }

            return created;
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
        initComponents: function() {
            var root = this._componentRoot || this,
                owner = this;

            /* components defined on the prototype are always rooted locally */
            var created = this._createComponents(this.constructor.prototype.components, owner, owner);

            /* components defined on the instance always inherit the root */
            if (this.hasOwnProperty('components')) created = created.concat(this._createComponents(this.components, root, owner));

            this._components = created;
        }
    });

    return _Component;
});