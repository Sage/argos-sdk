define('argos', ['dojo/_base/window'], function(win) {
    var global = win.global,
        /* todo: store instances in a more appropriate manner? */
        application = function() { return global.App; },
        customizations = function() { return global.App.customizations; },
        scene = function() { return global.App.scene; },
        map = {
            'application': application,
            'customizations': customizations,
            'scene': scene
        };
    return {
        load: function(id, require, callback) {
            callback(map[id]);
        }
    };
});