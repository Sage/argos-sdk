define('Sage/Platform/Mobile/Views/Associate', ['Sage/Platform/Mobile/List'], function() {
    return dojo.declare('Sage.Platform.Mobile.Views.Associate', [Sage.Platform.Mobile.List], {
        id: 'associate_list',

        _onSearchExpression: function(expression) {
            this.clear(false);

            this.queryText = '';
            this.query = expression;

            // allow global search
            this.options.where = null;
            this.queryWhere = null;

            this.requestData();
        },
        show: function(options){
            dojo.mixin(this, options);
            this.inherited(arguments);
        }
    });
});