define('Sage/Platform/Mobile/Data/SDataStore', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/string'
], function (
    declare,
    lang,
    array,
    string
) {
    return declare('Sage.Data.SDataStore', null, {
        executeReadWith: 'read',
        where: null,
        select: null,
        include: null,
        orderBy: null,
        request: null,
        queryName: null,
        contractName: null,
        resourceKind: null,
        resourceProperty: null,
        resourcePredicate: null,
        labelAttribute: '$descriptor',
        identityAttribute: '$key',
        itemsAttribute: '$resources',
        constructor: function(options) {
            lang.mixin(this, options);

            this._features = {
                'dojo.data.api.Read': true,
                'dojo.data.api.Identity': true
            };
        },
        getFeatures: function() {
            return this._features;
        },
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        _createRequest: function(keywordArgs) {
            var request = this.expandExpression(keywordArgs.request || this.request);
            if (request)
            {
                request = request.clone();
            }
            else
            {
                var queryName = this.expandExpression(keywordArgs.queryName || this.queryName),
                    contractName = this.expandExpression(keywordArgs.contractName || this.contractName),
                    resourceKind = this.expandExpression(keywordArgs.resourceKind || this.resourceKind),
                    resourceProperty = this.expandExpression(keywordArgs.resourceProperty || this.resourceProperty),
                    resourcePredicate = this.expandExpression(keywordArgs.resourcePredicate || this.resourcePredicate);

                request = queryName
                    ? new Sage.SData.Client.SDataNamedQueryRequest(this.service).setQueryName(queryName)
                    : new Sage.SData.Client.SDataResourceCollectionRequest(this.service);

                if (contractName) request.setContractName(contractName);
                if (resourceKind) request.setResourceKind(resourceKind);
                if (resourceProperty) request.getUri().setPathSegment(Sage.SData.Client.SDataUri.ResourcePropertyIndex, resourceProperty);
                if (resourcePredicate) request.getUri().setCollectionPredicate(resourcePredicate);
            }

            var select = this.expandExpression(keywordArgs.select || this.select),
                orderBy = this.expandExpression(keywordArgs.sort || this.orderBy),
                include = this.expandExpression(keywordArgs.include || this.include),
                conditions = [];

            if (select && select.length > 0)
                request.setQueryArg('select', select.join(','));

            if (include && include.length > 0)
                request.setQueryArg('include', include.join(','));

            if (orderBy)
            {
                if (typeof orderBy === 'string')
                {
                    request.setQueryArg('orderby', orderBy);
                }
                else if (orderBy.length > 0)
                {
                    var order = [];
                    array.forEach(orderBy, function (v) {
                        if (v.descending)
                            this.push(v.attribute + ' desc');
                        else
                            this.push(v.attribute);
                    }, order);

                    request.setQueryArg('orderby', order.join(','));
                }
            }

            if (this.where)
                conditions.push(this.where);

            if (keywordArgs.query)
                conditions.push(keywordArgs.query);

            if (conditions.length > 0)
                request.setQueryArg('where', '(' + conditions.join(') and (') + ')');

            if (typeof keywordArgs.start !== 'undefined')
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.StartIndex, keywordArgs.start + 1);

            if (typeof keywordArgs.count !== 'undefined')
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Count, keywordArgs.count);

            return request;
        },
        fetch: function(keywordArgs) {
            var request = this._createRequest(keywordArgs),
                requestObject = lang.mixin({
                    store: this
                }, keywordArgs);
            var handle = request[this.executeReadWith]({
                success: lang.hitch(this, this._onFetchSuccess, keywordArgs, requestObject),
                failure: lang.hitch(this, this._onFetchFailure, keywordArgs, requestObject),
                abort: lang.hitch(this, this._onFetchAbort, keywordArgs, requestObject),
                httpMethodOverride: keywordArgs.queryOptions && keywordArgs.queryOptions['httpMethodOverride']
            });
            requestObject['abort'] = lang.hitch(this, this._abortRequest, handle);
            return requestObject;
        },
        fetchItemByIdentity: function(keywordArgs) {
            var predicate = (/(\s+)/.test(keywordArgs.identity))
                ? keywordArgs.identity
                : string.substitute("'${0}'", [keywordArgs.identity]);

            return this.fetch(lang.mixin({
                resourcePredicate: predicate
            }, keywordArgs));
        },
        close: function(request) {
            request.abort();
        },
        _abortRequest: function(handle) {
            this.service.abortRequest(handle);
        },
        _onFetchSuccess: function(keywordArgs, requestObject, result) {
            if (result)
            {
                if (result['$resources'])
                    requestObject['feed'] = result['$resources'];
                else
                    requestObject['entry'] = result;

                var items = lang.getObject(this.itemsAttribute, false, result) || [result],
                    size = result['$resources']
                        ? result['$totalResults'] || -1
                        : 1;

                if (keywordArgs.onBegin)
                    keywordArgs.onBegin.call(keywordArgs.scope || this, size, requestObject);

                if (keywordArgs.onItem)
                    for (var i = 0; i < items.length; i++)
                        keywordArgs.onItem.call(keywordArgs.scope || this, items[i], requestObject);

                if (keywordArgs.onComplete)
                    keywordArgs.onComplete.call(keywordArgs.scope || this, keywordArgs.onItem ? null : items, requestObject);
            }
            else
            {
                if (keywordArgs.onError)
                    keywordArgs.onError.call(keywordArgs.scope || this, 'invalid feed', keywordArgs);
            }
        },
        _onFetchFailure: function(keywordArgs, requestObject, xhr, xhrOptions) {
            if (keywordArgs.onError)
                keywordArgs.onError.call(keywordArgs.scope || this, xhr.responseText, keywordArgs, xhr, xhrOptions);
        },
        _onFetchAbort: function(keywordArgs, requestObject, xhr, xhrOptions) {
            if (keywordArgs.onAbort)
                keywordArgs.onAbort.call(keywordArgs.scope || this, xhr.responseText, keywordArgs, xhr, xhrOptions);
            else
                this._onFetchFailure(keywordArgs, requestObject, xhr, xhrOptions);
        },
        getLabel: function(item) {
            return this.getValue(item, this.labelAttribute, '');
        },
        getIdentity: function(item) {
            return this.getValue(item, this.identityAttribute, '');
        },
        getIdentityAttributes: function(item) {
            return [this.identityAttribute];
        },
        getLabelAttributes: function(item) {
            return [this.labelAttribute];
        },
        getValue: function(item, attribute, defaultValue) {
            return lang.getObject(attribute, false, item) || defaultValue;
        }
    });
});