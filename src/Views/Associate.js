define('Sage/Platform/Mobile/Views/Associate', ['Sage/Platform/Mobile/List'], function() {
    return dojo.declare('Sage.Platform.Mobile.Views.Associate', [Sage.Platform.Mobile.List], {
        id: 'associate_list',
        show: function(options){
            dojo.mixin(this, options);
            this.inherited(arguments);
        }
    });
});