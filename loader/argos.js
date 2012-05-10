define(['dojo/_base/window'], function(win) {
    var global = win.global,
        map = {
            /* todo: store instances in a more appropriate */
            'application': function() { return global.App; },
            'scene': function() { return global.App && global.App.getSceneManager(); }
        };

    return {
        load: function(id, require, callback) {
            callback(map[id]);
        }
    };
});