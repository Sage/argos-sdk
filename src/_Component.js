define('Sage/Platform/Mobile/_Component', [
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/connect',
    'dijit/_WidgetBase',
    'dijit/_Container'
], function(
    declare,
    array,
    lang,
    connect,
    _WidgetBase,
    _Container
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
        owner: null,
        _componentSignals: null,
        startup: function() {
            this.initComponents();
            this.inherited(arguments);

            array.forEach(this.components, function(component) {
                if (component.isInstanceOf(_WidgetBase) && component._started) return;

                component.startup();
            });
        },
        destroy: function() {
            array.forEach(this._componentSignals, function(signal) {
                signal.remove();
            });
            this._componentSignals = null;

            this.inherited(arguments);

            array.forEach(this.components, function(component) {
                if (component.isInstanceOf(_WidgetBase) && component._beingDestroyed) return;

                component.destroy();
            });

            this.components = null;
        },
        initComponents: function() {
            var created = [];

            for (var i = 0; i < this.components.length; i++)
            {
                var component = this.components[i],
                    type = component.type,
                    ctor = lang.isFunction(type) ? type : lang.getObject(type, false);

                if (!ctor) throw new Error('Invalid component type.');

                var instance = new ctor(component.props);
                if (instance.isInstanceOf(_Component))
                    instance.owner = this;

                created.push(instance);

                var attach = component.attachPoint,
                    events = component.attachEvent;

                if (attach)
                {
                    if (lang.getObject(attach, false, this)) throw new Error('Attach point already occupied.');

                    lang.setObject(attach, instance, this);
                }

                if (events && lang.isString(events))
                    events = parse(events);

                if (events)
                {
                    this._componentSignals = (this._componentSignals || []);

                    for (var name in events)
                    {
                        this._componentSignals.push(connect.connect(instance, name, this, events[name]));
                    }
                }

                if (instance.isInstanceOf(_WidgetBase))
                {
                    if (this.isInstanceOf(_Container))
                        this.addChild(instance, component.position);
                    else if (this.isInstanceOf(_WidgetBase))
                        instance.placeAt(this.containerNode || this.domNode, component.position);
                }
            }

            this.components = created;
        }
    });

    return _Component;
});