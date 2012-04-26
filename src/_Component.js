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
        _componentRoot: null,
        _componentOwner: null,
        _componentSignals: null,
        startup: function() {
            this.initComponents();
            this.inherited(arguments);

            array.forEach(this.components, function(component) {
                this._startupComponent(component);
            }, this);
        },
        destroy: function() {
            array.forEach(this._componentSignals, function(signal) {
                signal.remove();
            });
            this._componentSignals = null;

            this.inherited(arguments);

            array.forEach(this.components, function(component) {
                this._destroyComponent(component);
            }, this);

            this.components = null;
        },
        _startupComponent: function(instance) {
            instance.startup();
        },
        _destroyComponent: function(instance) {
            instance.destroy();
        },
        _attachComponent: function(component, instance, root, owner) {
            var target = root,
                attach = component.attachPoint,
                events = component.attachEvent;

            if (attach)
            {
                if (lang.getObject(attach, false, target)) throw new Error('Attach point already occupied.');

                lang.setObject(attach, instance, target);
            }

            if (events && lang.isString(events))
                events = parse(events);

            if (events)
            {
                /* this component is responsible for the connection */
                this._componentSignals = (this._componentSignals || []);

                for (var name in events)
                {
                    this._componentSignals.push(connect.connect(instance, name, target, events[name]));
                }
            }
        },
        _createComponent: function(component, root, owner) {
            var type = component.type,
                ctor = lang.isFunction(type) ? type : lang.getObject(type, false);

            if (!ctor) throw new Error('Invalid component type.');

            var instance = new ctor(lang.mixin({components: component.components}, component.props));
            if (instance.isInstanceOf(_Component))
            {
                instance._componentRoot = root;
                instance._componentOwner = owner;
            }

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
        initComponents: function() {
            var root = this._componentRoot || this,
                owner = this;

            /* components defined on the prototype are always rooted locally */
            var created = this._createComponents(this.constructor.prototype.components, owner, owner);

            /* components defined on the instance always inherit the root */
            if (this.hasOwnProperty('components')) created = created.concat(this._createComponents(this.components, root, owner));

            this.components = created;
        }
    });

    return _Component;
});