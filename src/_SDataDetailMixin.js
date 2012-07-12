define('Sage/Platform/Mobile/_SDataDetailMixin', [
    'dojo/_base/declare',
    './Store/SData'
], function(
    declare,
    SData
) {
    /**
     * SData enablement for the Detail view.
     */
    return declare('Sage.Platform.Mobile._SDataDetailMixin', null, {
        /**
         * @cfg {String} resourceKind
         * The SData resource kind the view is responsible for.  This will be used as the default resource kind
         * for all SData requests.
         * @type {String}
         */
        resourceKind: '',
        /**
         * A list of fields to be selected in an SData request.
         * @type {Array.<String>}
         */
        querySelect: null,
        /**
         * A list of child properties to be included in an SData request.
         * @type {Array.<String>}
         */
        queryInclude: null,
        /**
         * The default resource property for an SData request.
         * @type {String|Function}
         */
        resourceProperty: null,
        /**
         * The default resource predicate for an SData request.
         * @type {String|Function}
         */
        resourcePredicate: null,
        keyProperty: '$key',
        descriptorProperty: '$descriptor',
        createStore: function() {
            return new SData({
                service: this.getConnection(),
                contractName: this.expandExpression(this.contractName),
                resourceKind: this.expandExpression(this.resourceKind),
                resourceProperty: this.expandExpression(this.resourceProperty),
                resourcePredicate: this.expandExpression(this.resourcePredicate),
                include: this.expandExpression(this.queryInclude),
                select: this.expandExpression(this.querySelect),
                identityProperty: this.keyProperty
            });
        },
        _buildGetExpression: function() {
            var options = this.options;

            return options && (options.id || options.key);
        },
        _applyStateToGetOptions: function(getOptions) {
            var options = this.options;
            if (options)
            {
                if (options.select) getOptions.select = this.expandExpression(options.select);
                if (options.include) getOptions.include = this.expandExpression(options.include);
                if (options.contractName) getOptions.contractName = this.expandExpression(options.contractName);
                if (options.resourceKind) getOptions.resourceKind = this.expandExpression(options.resourceKind);
                if (options.resourceProperty) getOptions.resourceProperty = this.expandExpression(options.resourceProperty);
                if (options.resourcePredicate) getOptions.resourcePredicate = this.expandExpression(options.resourcePredicate);
            }
        }
    });
});