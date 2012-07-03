define('Sage/Platform/Mobile/Data/SDataStore', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/string',
    'dojo/json',
    '../Convert',
    '../Utility'
], function (
    declare,
    lang,
    array,
    string,
    json,
    convert,
    utility
) {
    var transformQuery = function(query) {
        if (typeof query === 'object')
        {
            // todo: add support for transforming a recommended object query
            return query;
        }

        return query;
    };

    return declare('Sage.Data.SDataStore', null, {
        _create: null,
        _update: null,
        _delete: null,
        clearOnClose: true,
        doDateConversion: true,

        where: null,
        select: null,
        include: null,
        orderBy: null,
        service: null,
        request: null,
        queryName: null,
        entityName: null,
        contractName: null,
        resourceKind: null,
        resourceProperty: null,
        resourcePredicate: null,
        itemsAttribute: '$resources',
        labelAttribute: '$descriptor',
        identityAttribute: '$key',
        versionAttribute: '$etag',
        executeFetchAs: null,
        executeFetchItemAs: null,

        constructor: function(options) {
            lang.mixin(this, options);

            this._create = [];
            this._update = {};
            this._delete = {};

            this._features = {
                'dojo.data.api.Read': true,
                'dojo.data.api.Write': true,
                'dojo.data.api.Identity': true
            };
        },
        getFeatures: function() {
            return this._features;
        },
        _createEntryRequest: function(keywordArgs) {
            var request = utility.expand(this, keywordArgs.request || this.request);
            if (request)
            {
                request = request.clone();
            }
            else
            {
                var contractName = utility.expand(this, keywordArgs.contractName || this.contractName),
                    resourceKind = utility.expand(this, keywordArgs.resourceKind || this.resourceKind),
                    resourceProperty = utility.expand(this, keywordArgs.resourceProperty || this.resourceProperty),
                    resourcePredicate = keywordArgs.identity
                        ? json.stringify(keywordArgs.identity) /* string keys are quoted, numeric keys are left alone */
                        : utility.expand(this, keywordArgs.resourcePredicate || this.resourcePredicate);

                if (resourceProperty)
                {
                    request = new Sage.SData.Client.SDataResourcePropertyRequest(this.service)
                        .setResourceProperty(resourceProperty)
                        .setResourceSelector(resourcePredicate);
                }
                else
                {
                    request = new Sage.SData.Client.SDataSingleResourceRequest(this.service)
                        .setResourceSelector(resourcePredicate);
                }

                if (contractName) request.setContractName(contractName);
                if (resourceKind) request.setResourceKind(resourceKind);
            }

            var select = utility.expand(this, keywordArgs.select || this.select),
                include = utility.expand(this, keywordArgs.include || this.include);

            if (select && select.length > 0)
                request.setQueryArg('select', select.join(','));

            if (include && include.length > 0)
                request.setQueryArg('include', include.join(','));

            return request;
        },
        _createFeedRequest: function(keywordArgs) {
            var request = utility.expand(this, keywordArgs.request || this.request);
            if (request)
            {
                request = request.clone();
            }
            else
            {
                var queryName = utility.expand(this, keywordArgs.queryName || this.queryName),
                    contractName = utility.expand(this, keywordArgs.contractName || this.contractName),
                    resourceKind = utility.expand(this, keywordArgs.resourceKind || this.resourceKind),
                    resourceProperty = utility.expand(this, keywordArgs.resourceProperty || this.resourceProperty),
                    resourcePredicate = utility.expand(this, keywordArgs.resourcePredicate || this.resourcePredicate);

                if (queryName)
                {
                    request = new Sage.SData.Client.SDataNamedQueryRequest(this.service)
                        .setQueryName(queryName);

                    if (resourcePredicate) request.getUri().setCollectionPredicate(resourcePredicate);
                }
                else if (resourceProperty)
                {
                    request = new Sage.SData.Client.SDataResourcePropertyRequest(this.service)
                        .setResourceProperty(resourceProperty)
                        .setResourceSelector(resourcePredicate);
                }
                else
                {
                    request = new Sage.SData.Client.SDataResourceCollectionRequest(this.service);
                }

                if (contractName) request.setContractName(contractName);
                if (resourceKind) request.setResourceKind(resourceKind);
            }

            var select = utility.expand(this, keywordArgs.select || this.select),
                include = utility.expand(this, keywordArgs.include || this.include),
                orderBy = utility.expand(this, keywordArgs.sort || this.orderBy);

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

            var where = utility.expand(this, this.where),
                query = utility.expand(this, keywordArgs.query),
                conditions = [];

            if (where)
                conditions.push(where);

            if (query)
                conditions.push(transformQuery(query));

            if (conditions.length > 0)
                request.setQueryArg('where', '(' + conditions.join(') and (') + ')');

            if (typeof keywordArgs.start !== 'undefined')
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.StartIndex, keywordArgs.start + 1);

            if (typeof keywordArgs.count !== 'undefined')
                request.setQueryArg(Sage.SData.Client.SDataUri.QueryArgNames.Count, keywordArgs.count);

            return request;
        },
        fetch: function(keywordArgs) {
            var request = this._createFeedRequest(keywordArgs),
                requestObject = lang.mixin({
                    store: this
                }, keywordArgs);

            var method = this.executeFetchAs
                ? request[this.executeFetchAs]
                : request instanceof Sage.SData.Client.SDataResourcePropertyRequest
                    ? request.readFeed
                    : request.read;

            var handle = method.call(request, {
                success: lang.hitch(this, this._onRequestFeedSuccess, keywordArgs, requestObject),
                failure: lang.hitch(this, this._onRequestFailure, keywordArgs, requestObject),
                abort: lang.hitch(this, this._onRequestAbort, keywordArgs, requestObject),
                httpMethodOverride: keywordArgs.queryOptions && keywordArgs.queryOptions['httpMethodOverride']
            });

            requestObject['abort'] = lang.hitch(this, this._abortRequest, handle);

            return requestObject;
        },
        fetchItemByIdentity: function(keywordArgs) {
            var request = this._createEntryRequest(keywordArgs),
                requestObject = lang.mixin({
                    store: this
                }, keywordArgs);

            var method = this.executeFetchItemAs
                ? request[this.executeFetchItemAs]
                : request.read;

            var handle = method.call(request, {
                success: lang.hitch(this, this._onRequestEntrySuccess, keywordArgs, requestObject),
                failure: lang.hitch(this, this._onRequestFailure, keywordArgs, requestObject),
                abort: lang.hitch(this, this._onRequestAbort, keywordArgs, requestObject)
            });

            requestObject['abort'] = lang.hitch(this, this._abortRequest, handle);

            return requestObject;
        },
        close: function(request) {
            if (request)
            {
                request.abort();
            }
            else
            {
                this.revert();
            }
        },
        _abortRequest: function(handle) {
            this.service.abortRequest(handle);
        },
        _onRequestFeedSuccess: function(keywordArgs, requestObject, result) {
            if (result)
            {
                var items = lang.getObject(this.itemsAttribute, false, result) || [result],
                    size = typeof result['$totalResults'] === 'number' ? result['$totalResults'] : -1;

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
        _onRequestEntrySuccess: function(keywordArgs, requestObject, result) {
            if (result)
            {
                if (keywordArgs.onItem)
                    keywordArgs.onItem.call(keywordArgs.scope || this, result, requestObject);
            }
            else
            {
                if (keywordArgs.onError)
                    keywordArgs.onError.call(keywordArgs.scope || this, 'invalid entry', keywordArgs);
            }
        },
        _onRequestFailure: function(keywordArgs, requestObject, xhr, xhrOptions) {
            if (keywordArgs.onError)
            {
                var error = new Error('An error occurred requesting: ' + xhrOptions.url);

                error.xhr = xhr;
                error.status = xhr.status;
                error.responseText = xhr.responseText;

                keywordArgs.onError.call(keywordArgs.scope || this, error, keywordArgs, xhr, xhrOptions);
            }
        },
        _onRequestAbort: function(keywordArgs, requestObject, xhr, xhrOptions) {
            if (keywordArgs.onAbort)
            {
                var error = new Error('An abort occurred requesting data: ' + xhrOptions.url);

                error.xhr = xhr;
                error.status = xhr.status;
                error.responseText = xhr.responseText;

                keywordArgs.onAbort.call(keywordArgs.scope || this, error, keywordArgs, xhr, xhrOptions);
            }
            else
            {
                this._onRequestFailure(keywordArgs, requestObject, xhr, xhrOptions);
            }
        },
        isItem: function(something) {
            return something;
        },
        isItemLoaded: function(something) {
            return something;
        },
        loadItem: function(keywordArgs) {
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
            var value = lang.getObject(attribute, false, item);

            if (typeof value === 'undefined') return defaultValue;

            if (this.doDateConversion && convert.isDateString(value)) return convert.toDateFromString(value);

            return value;
        },
        newItem: function(keywordArgs, parentInfo) {
            var value = lang.mixin({}, keywordArgs);

            this._create.push(value);

            return value;
        },
        deleteItem: function(item) {
            var identity = this.getIdentity(item);
            if (!identity) return;

            this._delete[identity] = item;
        },
        setValue: function(item, attribute, value) {
            var identity = this.getIdentity(item),
                dirty;

            if (!identity)
            {
                // todo: not the fastest way, but ensures that the item is of this store, and keeps items free of store properties
                // todo: is this check necessary?
                if (this._create.indexOf(item) <= -1) return;

                dirty = item;
            }
            else
            {
                dirty = this._update[identity];

                if (!dirty)
                {
                    dirty = {};

                    lang.setObject(this.identityAttribute, identity, dirty);

                    var version = lang.getObject(this.versionAttribute, false, item);
                    if (version) lang.setObject(this.versionAttribute, version, dirty);

                    this._update[identity] = dirty;
                }
            }

            if (this.doDateConversion && convert.isDate(value))
                value = this.service.isJsonEnabled()
                    ? convert.toJsonStringFromDate(value)
                    : convert.toIsoStringFromDate(value);

            lang.setObject(attribute, value, dirty);
        },
        setValues: function(item, attribute, values) {
            this.setValue(item, attribute, values);
        },
        unsetAttribute: function(item, attribute) {
            var identity = this.getIdentity(item);

            if (!identity) return;

            var dirty = this._update[identity];

            if (!dirty) return;

            var parts = attribute.split('.'),
                property = parts.pop(),
                path = parts.join('.');

            var container = lang.getObject(path, false, dirty);
            if (container) delete container[property];
        },
        save: function(keywordArgs) {
        },
        revert: function() {
            this._create = [];
            this._update = {};
            this._delete = {};
        },
        isDirty: function(item) {
            if (item)
            {
                var identity = this.getIdentity(item);

                if (!identity) return;

                if (this._update[identity]) return true;
                if (this._delete[identity]) return true;
                if (this._create.indexOf(item) > -1) return true;

                return false;
            }
            else
            {
                if (this._create.length > 0) return true;

                var dirty = false;

                for (var key in this._update) { dirty = true; break; }
                for (var key in this._delete) { dirty = true; break; }

                return dirty;
            }
        }
    });
});