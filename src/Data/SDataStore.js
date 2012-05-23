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
        sort: null,
        where: null,
        select: null,
        include: null,
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
        _expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        _createRequest: function (options) {
            var query = '',
                request = this._expandExpression(options.request || this.request),
                orderBy = this._expandExpression(options.sort || this.orderBy),
                include = this._expandExpression(options.include || this.include),
                select = this._expandExpression(options.select || this.select);

            if (options.query)
            {
                if (this.where)
                {
                    query = this._expandExpression(this.where) + ' and (' + this._expandExpression(options.query) + ' )';
                }
                else
                {
                    query = this._expandExpression(options.query);
                }
            }
            else
            {
                query = this._expandExpression(this.where);
            }

            if (request)
            {
                request = request.clone();
            }
            else
            {
                var queryName = this._expandExpression(options.queryName || this.queryName),
                    contractName = this._expandExpression(options.contractName || this.contractName),
                    resourceKind = this._expandExpression(options.resourceKind || this.resourceKind),
                    resourceProperty = this._expandExpression(options.resourceProperty || this.resourceProperty),
                    resourcePredicate = this._expandExpression(options.resourcePredicate || this.resourcePredicate);

                request = queryName
                    ? new Sage.SData.Client.SDataNamedQueryRequest(this.service).setQueryName(queryName)
                    : new Sage.SData.Client.SDataResourceCollectionRequest(this.service);

                if (contractName) request.setContractName(contractName);
                if (resourceKind) request.setResourceKind(resourceKind);
                if (resourceProperty) request.getUri().setPathSegment(Sage.SData.Client.SDataUri.ResourcePropertyIndex, resourceProperty);
                if (resourcePredicate) request.getUri().setCollectionPredicate(resourcePredicate);
            }

            if (select && select.length > 0)
                request.setQueryArg('select', select.join(','));

            if (include && include.length > 0)
                request.setQueryArg('include', include.join(','));

            if (query)
                request.setQueryArg('where', query);

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

            if (typeof options.start !== 'undefined')
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.StartIndex, options.start + 1);

            if (typeof options.count !== 'undefined')
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Count, options.count);

            return request;
        },
        fetch: function(options) {
            var request = this._createRequest(options),
                requestObject = lang.mixin({
                    store: this
                }, options);
            var handle = request[this.executeReadWith]({
                success: lang.hitch(this, this._onFetchSuccess, options, requestObject),
                failure: lang.hitch(this, this._onFetchFailure, options, requestObject),
                abort: lang.hitch(this, this._onFetchAbort, options, requestObject),
                httpMethodOverride: options.queryOptions && options.queryOptions['httpMethodOverride']
            });
            requestObject['abort'] = lang.hitch(this, this._abortRequest, handle);
            return requestObject;
        },
        fetchItemByIdentity: function(options) {
            var predicate = (/(\s+)/.test(options.identity))
                ? options.identity
                : string.substitute("'${0}'", [options.identity]);

            return this.fetch(lang.mixin({
                resourcePredicate: predicate
            }, options));
        },
        close: function(request) {
            request.abort();
        },
        _abortRequest: function(handle) {
            this.service.abortRequest(handle);
        },
        _onFetchSuccess: function(options, requestObject, result) {
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

                if (options.onBegin)
                    options.onBegin.call(options.scope || this, size, requestObject);

                if (options.onItem)
                    for (var i = 0; i < items.length; i++)
                        options.onItem.call(options.scope || this, items[i], requestObject);

                if (options.onComplete)
                    options.onComplete.call(options.scope || this, options.onItem ? null : items, requestObject);
            }
            else
            {
                if (options.onError)
                    options.onError.call(options.scope || this, 'invalid feed', options);
            }
        },
        _onFetchFailure: function(options, requestObject, xhr, xhrOptions) {
            if (options.onError)
                options.onError.call(options.scope || this, xhr.responseText, options, xhr, xhrOptions);
        },
        _onFetchAbort: function(options, requestObject, xhr, xhrOptions) {
            if (options.onAbort)
                options.onAbort.call(options.scope || this, xhr.responseText, options, xhr, xhrOptions);
            else
                this._onFetchFailure(options, requestObject, xhr, xhrOptions);
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