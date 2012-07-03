define('Sage/Platform/Mobile/_SDataEditMixin', [
    'dojo/_base/declare',
    'dojo/string',
    'dojo/dom-class',
    './ErrorManager',
    './Data/SDataStore'
], function(
    declare,
    string,
    domClass,
    ErrorManager,
    SDataStore
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
        versionProperty: '$etag',
        createStore: function() {
            return new SDataStore({
                service: this.getConnection(),
                entityName: this.entityName,
                contractName: this.expandExpression(this.contractName),
                resourceKind: this.expandExpression(this.resourceKind),
                resourceProperty: this.expandExpression(this.resourceProperty),
                resourcePredicate: this.expandExpression(this.resourcePredicate),
                include: this.expandExpression(this.queryInclude),
                select: this.expandExpression(this.querySelect),
                labelAttribute: this.descriptorProperty,
                identityAttribute: this.keyProperty
            });
        },
        applyOptionsToFetchItem: function(keywordArgs) {
            var options = this.options;

            if (options)
            {
                if (options.key) keywordArgs.identity = options.key;
                if (options.select) keywordArgs.select = this.expandExpression(options.select);
                if (options.include) keywordArgs.include = this.expandExpression(options.include);
                if (options.contractName) keywordArgs.contractName = this.expandExpression(options.contractName);
                if (options.resourceKind) keywordArgs.resourceKind = this.expandExpression(options.resourceKind);
                if (options.resourceProperty) keywordArgs.resourceProperty = this.expandExpression(options.resourceProperty);
                if (options.resourcePredicate) keywordArgs.resourcePredicate = this.expandExpression(options.resourcePredicate);
            }
        },
        _onRequestTemplateFailure: function(xhr, xhrOptions) {
            var error = new Error('An error occurred requesting: ' + xhrOptions.url);

            error.xhr = xhr;
            error.status = xhr.status;
            error.responseText = xhr.responseText;

            this._onFetchError(error, {});
        },
        _onRequestTemplateSuccess: function(template) {
            this._onFetchItemTemplate(template);
        },
        requestItemTemplate: function() {
            var request = this.createTemplateRequest();
            if (request)
                request.read({
                    success: this._onRequestTemplateSuccess,
                    failure: this._onRequestTemplateFailure,
                    scope: this
                });
        },
        createTemplateRequest: function() {
            var request = new Sage.SData.Client.SDataTemplateResourceRequest(this.getConnection());

            if (this.resourceKind)
                request.setResourceKind(this.resourceKind);

            if (this.querySelect)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Select, this.querySelect.join(','));

            if (this.queryInclude)
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Include, this.queryInclude.join(','));

            return request;
        }
    });
});