define('Sage/Platform/Mobile/_ComponentContainerMixin', [
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang'
], function(
    declare,
    array,
    lang
) {
    var _Component = declare('Sage.Platform.Mobile._Component', null, {
        owner: null,
        create: function() {},
        destroy: function() {}
    });

    _Component.createComponent = function(component, options) {
        var owner = options.owner,
            type = component.type,
            ctor = lang.getObject(type, false);

        if (!ctor) throw new Error('Invalid component type.');

        var instance = new ctor(component.props);
        if (instance.isInstanceOf(_Component))
        {
            instance.owner = owner;
            instance.create();
        }

    };

    _Component.createComponents = function(components, options) {
        options = options || {};

        var creating = lang.isArray(components) ? components : [components],
            created = [];

        for (var i = 0; i < creating.length; i++)
        {
            var definition = creating[i],
                owner = options.owner,
                type = definition.type,
                ctor = lang.getObject(type, false);

            if (!ctor) throw new Error('Invalid component type.');

            var instance = new ctor(definition.props);
            if (instance.isInstanceOf(_Component))
            {
                instance.owner = owner;
                instance.create();
            }

            created.push(instance);
        }

        return lang.isArray(components) ? created : created[0];
    };
});