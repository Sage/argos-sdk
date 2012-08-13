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
                contractName: this.contractName,
                resourceKind: this.resourceKind,
                resourceProperty: this.resourceProperty,
                resourcePredicate: this.resourcePredicate,
                include: this.queryInclude,
                select: this.querySelect,
                identityProperty: this.keyProperty,
                scope: this
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
                if (options.select) getOptions.select = options.select;
                if (options.include) getOptions.include = options.include;
                if (options.contractName) getOptions.contractName = options.contractName;
                if (options.resourceKind) getOptions.resourceKind = options.resourceKind;
                if (options.resourceProperty) getOptions.resourceProperty = options.resourceProperty;
                if (options.resourcePredicate) getOptions.resourcePredicate = options.resourcePredicate;
            }
        }
    });
});