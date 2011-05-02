/*!
 * 
 */
(function(){
    var S = Sage,
        A = Sage.namespace('Sage.SData.Client.Ajax');

    var successful = function(code)
    {
        return ((code >= 200 && code < 300) || code === 304);
    };

    var onReadyStateChange = function(xhr, o)
    {
        if (xhr.readyState == 4)
        {
            if (successful(xhr.status))
            {
                if (o.success)
                    o.success.call(o.scope || this, xhr, o);
            }
            else if (xhr.status === 0)
            {
                var isAbortedRequest = false;
                try
                {
                    // FF will throw an exception on access of statusText on an aborted request
                    isAbortedRequest = (xhr.statusText === '');
                }
                catch (exception)
                {
                    isAbortedRequest = true;
                }

                if (isAbortedRequest)
                {
                    var handler = o.aborted || o.failure;
                    if (handler)
                        handler.call(o.scope || this, xhr, o);
                }
                else
                {
                    if (o.failure)
                        o.failure.call(o.scope || this, xhr, o);
                }
            }
            else
            {
                if (o.failure)
                    o.failure.call(o.scope || this, xhr, o);
            }
        }
    };

    var bindOnReadyStateChange = function(xhr, o) {
        xhr.onreadystatechange = function() {
            onReadyStateChange.call(xhr, xhr, o);
        };
    };

    var buildParameters = function(params) {
        var query = [];
        for (var n in params)
        {
            query.push(
                encodeURIComponent(n) +
                '=' +
                encodeURIComponent(params[n])
            );
        }
        return query.join('&');
    };

    Sage.apply(Sage.SData.Client.Ajax, {
        request: function(o) {
            var o = S.apply({}, o);

            o.params = S.apply({}, o.params);
            o.headers = S.apply({}, o.headers);

            if (o.cache !== false)
                o.params[o.cacheParam || '_t'] = (new Date()).getTime();

            o.method = o.method || 'GET';

            var parameters = buildParameters(o.params);
            if (parameters)
                o.url = o.url + (/\?/.test(o.url) ? '&' : '?') + parameters;

            var xhr = new XMLHttpRequest();

            if (o.user)
            {
                xhr.open(o.method, o.url, o.async !== false, o.user, o.password);
                xhr.withCredentials = true;
            }
            else
                xhr.open(o.method, o.url, o.async !== false);

            try
            {
                xhr.setRequestHeader('Accept', o.accept || '*/*');
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

                if (o.contentType)
                    xhr.setRequestHeader('Content-Type', o.contentType);

                for (var n in o.headers)
                    xhr.setRequestHeader(n, o.headers[n]);
            }
            catch (headerException)
            {
            }

            if (o.async !== false)
            {
                bindOnReadyStateChange(xhr, o);

                xhr.send(o.body || null);
            }
            else
            {
                xhr.send(o.body || null);

                onReadyStateChange(xhr, o);
            }

            return xhr;
        },
        cancel: function(xhr) {
            xhr.abort();
        }
    });
})();
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="SDataUri.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataBaseRequest = Sage.Class.define({
        constructor: function(service) {
            this.base.apply(this, arguments);

            this.service = service;
            this.uri = new Sage.SData.Client.SDataUri();

            if (this.service)
            {
                this.uri.setVersion(this.service.getVersion());
                this.uri.setIncludeContent(this.service.getIncludeContent());
                this.uri.setServer(this.service.getVirtualDirectory() ? this.service.getVirtualDirectory() : 'sdata');
                this.uri.setScheme(this.service.getProtocol());
                this.uri.setHost(this.service.getServerName());
                this.uri.setPort(this.service.getPort());
            }
        },
        getService: function() {
            /// <returns type="Sage.SData.Client.SDataService" />
            return this.service;
        },
        getUri: function() {
            /// <returns type="Sage.SData.Client.SDataUri" />
            return this.uri;
        },
        setUri: function(value) {
            this.uri = value;
            return this;
        },
        getServerName: function() {
            return this.uri.getHost();
        },
        setServerName: function(value) {
            this.uri.setHost(value);
            return this;
        },
        getVirtualDirectory: function() {
            return this.uri.getServer();
        },
        setVirtualDirectory: function(value) {
            this.uri.setServer(value);
            return this;
        },
        getProtocol: function() {
            return this.uri.getScheme();
        },
        setProtocol: function(value) {
            this.uri.setScheme(value);
            return this;
        },
        getPort: function() {
            return this.uri.getPort();
        },
        setPort: function(value) {
            this.uri.setPort(value);
            return this;
        },
        getQueryArgs: function() {
            return this.uri.getQueryArgs();
        },
        setQueryArgs: function(value, replace) {
            this.uri.setQueryArgs(value, replace);
            return this;
        },
        getQueryArg: function(key) {
            return this.uri.getQueryArg(key);
        },
        setQueryArg: function(key, value) {
            this.uri.setQueryArg(key, value);
            return this;
        },
        build: function(excludeQuery) {
            return this.uri.build(excludeQuery);
        }
    });
})();
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="SDataUri.js"/>
/// <reference path="SDataBaseRequest.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataApplicationRequest = Sage.SData.Client.SDataBaseRequest.extend({
        constructor: function() {
            this.base.apply(this, arguments);

            if (this.service)
            {
                this.uri.setProduct(this.service.getApplicationName() ? this.service.getApplicationName() : '-');
                this.uri.setContract(this.service.getContractName() ? this.service.getContractName() : '-');
                this.uri.setCompanyDataset(this.service.getDataSet() ? this.service.getDataSet() : '-');
            }
        },
        getApplicationName: function() {
            return this.uri.getProduct();
        },
        setApplicationName: function(value) {
            this.uri.setProduct(value);
            return this;
        },
        getContractName: function() {
            return this.uri.getContract();
        },
        setContractName: function(value) {
            this.uri.setContract(value);
            return this;
        },
        getDataSet: function() {
            return this.uri.getCompanyDataset();
        },
        setDataSet: function(value) {
            this.uri.setCompanyDataset(value);
            return this;
        },
        getResourceKind: function() {
            return this.uri.getCollectionType();
        },
        setResourceKind: function(value) {
            this.uri.setCollectionType(value);
            return this;
        }
    });
})();

/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="SDataUri.js"/>
/// <reference path="SDataBaseRequest.js"/>
/// <reference path="SDataApplicationRequest.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataResourceCollectionRequest = Sage.SData.Client.SDataApplicationRequest.extend({
        constructor: function() {
            this.base.apply(this, arguments);
        },
        getCount: function() {
            return this.uri.getCount();
        },
        setCount: function(value) {
            this.uri.setCount(value);
            return this;
        },
        getStartIndex: function() {
            return this.uri.getStartIndex();
        },
        setStartIndex: function(value) {
            this.uri.setStartIndex(value);
            return this;
        },
        read: function(options) {
            return this.service.readFeed(this, options);
        }
    });
})();
(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataNamedQueryRequest = Sage.SData.Client.SDataResourceCollectionRequest.extend({
        constructor: function() {
            this.base.apply(this, arguments);

            this.uri.setPathSegment(
                C.SDataUri.ResourcePropertyIndex,
                C.SDataUri.NamedQuerySegment
            );
        },
        getQueryName: function() {
            return this.uri.getPathSegment(C.SDataUri.ResourcePropertyIndex + 1);
        },
        setQueryName: function(value) {
            this.uri.setPathSegment(
                C.SDataUri.ResourcePropertyIndex + 1,
                value
            );
            return this;
        }
    });
})();
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="SDataUri.js"/>
/// <reference path="SDataBaseRequest.js"/>
/// <reference path="SDataApplicationRequest.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataSingleResourceRequest = Sage.SData.Client.SDataApplicationRequest.extend({
        constructor: function() {
            this.base.apply(this, arguments);
        },
        read: function(options) {
            return this.service.readEntry(this, options);
        },
        update: function(entry, options) {
            return this.service.updateEntry(this, entry, options);
        },
        create: function(entry, options) {
            return this.service.createEntry(this, entry, options);
        },
        'delete': function(entry, options) {
            return this.service.deleteEntry(this, entry, options);
        },
        getResourceSelector: function() {
            return this.uri.getCollectionPredicate();
        },
        setResourceSelector: function(value) {
            this.uri.setCollectionPredicate(value);
            return this;
        },
        setAccept: function(val) {
        	this.accept = val;
        }
    });
})();
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="SDataUri.js"/>
/// <reference path="SDataBaseRequest.js"/>
/// <reference path="SDataApplicationRequest.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataResourcePropertyRequest = Sage.SData.Client.SDataSingleResourceRequest.extend({
        constructor: function() {
            this.base.apply(this, arguments);
        },       
        readFeed: function(options) {
            return this.service.readFeed(this, options);
        },
        getResourceProperty: function() {
            return this.uri.getPathSegment(Sage.SData.Client.SDataUri.ResourcePropertyIndex);
        },
        setResourceProperty: function(value) {
            this.uri.setPathSegment(Sage.SData.Client.SDataUri.ResourcePropertyIndex, value);
            return this;
        }
    });
})();
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="SDataUri.js"/>
/// <reference path="SDataBaseRequest.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataSystemRequest = Sage.SData.Client.SDataBaseRequest.extend({
        constructor: function() {
            this.base.apply(this, arguments);

            this.uri.setPathSegment(
                Sage.SData.Client.SDataUri.ProductPathIndex,
                Sage.SData.Client.SDataUri.SystemSegment
            );
        },
        getCategory: function() {
            this.uri.getPathSegment(Sage.SData.Client.SDataUri.ContractTypePathIndex);
        },
        setCategory: function(value) {
            this.uri.setPathSegment(Sage.SData.Client.SDataUri.ContractTypePathIndex, value);
            return this;
        },
        read: function(options) {
            return this.service.readFeed(this, options);
        }
    });
})();
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="SDataUri.js"/>
/// <reference path="SDataBaseRequest.js"/>
/// <reference path="SDataApplicationRequest.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataTemplateResourceRequest = Sage.SData.Client.SDataApplicationRequest.extend({
        constructor: function() {
            this.base.apply(this, arguments);

            this.uri.setPathSegment(
                Sage.SData.Client.SDataUri.ResourcePropertyIndex,
                Sage.SData.Client.SDataUri.TemplateSegment
            );
        },
        read: function(options) {
            return this.service.readEntry(this, options);
        }
    });
})();
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="SDataUri.js"/>
/// <reference path="SDataBaseRequest.js"/>
/// <reference path="SDataApplicationRequest.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataServiceOperationRequest = Sage.SData.Client.SDataApplicationRequest.extend({
        constructor: function() {
            this.base.apply(this, arguments);

            this.uri.setPathSegment(
                C.SDataUri.ResourcePropertyIndex,
                C.SDataUri.ServiceMethodSegment
            );
        },
        execute: function(entry, options) {
            return this.service.executeServiceOperation(this, entry, options);
        },
        getOperationName: function() {
            return this.uri.getPathSegment(C.SDataUri.ResourcePropertyIndex + 1);
        },
        setOperationName: function(name) {
            this.uri.setPathSegment(C.SDataUri.ResourcePropertyIndex + 1, name);
            return this;
        }
    });
})();
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="SDataUri.js"/>
/// <reference path="SDataBaseRequest.js"/>
/// <reference path="SDataApplicationRequest.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client');

    Sage.SData.Client.SDataBatchRequest = Sage.SData.Client.SDataApplicationRequest.extend({
        items: null,
        constructor: function() {
            this.base.apply(this, arguments);

            this.items = [];
            this.uri.setPathSegment(
                Sage.SData.Client.SDataUri.ResourcePropertyIndex,
                Sage.SData.Client.SDataUri.BatchSegment
            );
        },
        using: function(fn, scope) {
            if (this.service)
                this.service.registerBatchScope(this);
            else
                throw "A service must be associated with the batch request.";

            try
            {
                fn.call(scope || this, this);
            }
            catch (e)
            {
                this.service.clearBatchScope(this);
                throw e;
            }

            this.service.clearBatchScope(this);

            return this;
        },
        add: function(item) {
            this.items.push(item);
        },
        commit: function(options) {
            this.service.commitBatch(this, options);
        }
    });
})();/// <reference path="../libraries/ext/ext-core-debug.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client'),
        trueRE = /^true$/i;

    Sage.SData.Client.SDataUri = Sage.Class.define({
        scheme: 'http',
        host: '',
        server: '',
        port: -1,
        version: null,
        queryArgs: null,
        pathSegments: null,
        constructor: function(uri) {
            /// <field name="scheme" type="String"></field>

            this.base.apply(this, arguments);

            S.apply(this, uri);

            /* create copies; segments only needs a shallow copy, as elements are replaced, not modified. */
            this.queryArgs = S.apply({}, uri && uri.queryArgs);
            this.pathSegments = (uri && uri.pathSegments && uri.pathSegments.slice(0)) || [];
            this.version = (uri && uri.version && S.apply({}, uri.version)) || { major: 1, minor: 0 };
        },
        getVersion: function() {
            return this.version;
        },
        setVersion: function(value) {
            this.version = S.apply({
                major: 0,
                minor: 0
            }, value);
            
            return this;
        },
        getScheme: function() {
            /// <returns type="String">The scheme component of the URI.</returns>
            return this.scheme;
        },
        setScheme: function(value) {
            /// <param name="val" type="String">The new scheme for the URI</param>
            this.scheme = value;

            return this;
        },
        getHost: function() {
            /// <returns type="String">The host component of the URI.</returns>
            return this.host;
        },
        setHost: function(value) {
            /// <param name="val" type="String">The new host for the URI</param>
            this.host = value;

            return this;
        },
        getPort: function() {
            /// <returns type="Number">The port component of the URI.</returns>
            return this.port;
        },
        setPort: function(value) {
            /// <param name="val" type="String">The new port for the URI</param>
            this.port = value;

            return this;
        },
        getServer: function() {
            /// <summary>
            ///     Access the SData "server" component of the URI.  This is the first path segment in the URI.
            ///
            ///     i.e. [scheme]://[host]/[server]
            /// </summary>
            /// <returns type="String">The SData "server" component of URI.</returns>
            return this.server;
        },
        setServer: function(value) {
            /// <param name="val" type="String">The new SData "server" for the URI</param>
            this.server = value;

            return this;
        },
        getQueryArgs: function() {
            /// <returns type="Object">The query arguments of the URI.</returns>
            return this.queryArgs;
        },
        setQueryArgs: function(value, replace) {
            /// <param name="val" type="Object">
            ///     The query arguments that will either be merged with the existing values, or replace
            ///     them entirely.
            /// <param>
            /// <param name="replace" type="Boolean" optional="true">True if you want to replace the existing query arguments.</param>
            this.queryArgs = replace ? value : S.apply(this.queryArgs, value);

            return this;
        },
        getQueryArg: function(key) {
            /// <summary>Returns the requested query argument.</summary>
            /// <param name="key" type="String">The name of the query argument to be returned.</param>
            /// <returns type="String">The value of the requested query argument.</returns>
            return this.queryArgs[key];
        },
        setQueryArg: function(key, value) {
            /// <summary>Sets a requested query argument.</summary>
            /// <param name="key" type="String">The name of the query argument to be set.</param>
            /// <param name="val" type="String">The new value for the query argument.</param>
            this.queryArgs[key] = value;

            return this;
        },
        getPathSegments: function() {
            /// <returns elementType="String">The path segments of the URI.</returns>
            return this.pathSegments;
        },
        setPathSegments: function(value) {
            this.pathSegments = value;

            return this;
        },
        getPathSegment: function(i) {
            return this.pathSegments.length > i
                ? this.pathSegments[i]
                : false;
        },
        setPathSegment: function(i, value, predicate) {
            /* can clear the segment */
            if (!value && !predicate)
            {
                this.pathSegments[i] = null;
            }
            /* merge object onto segment */
            else if (typeof value === 'object')
            {
                this.pathSegments[i] = S.apply({}, value, this.pathSegments[i]);
            }
            /* merge values onto segment */
            else
            {
                var segment = {};

                if (value) segment['text'] = value;
                if (predicate) segment['predicate'] = predicate;

                this.pathSegments[i] = S.apply({}, segment, this.pathSegments[i]);
            }
            
            return this;
        },
        getStartIndex: function() {
            return this.queryArgs[C.SDataUri.QueryArgNames.StartIndex]
                ? parseInt(this.queryArgs[C.SDataUri.QueryArgNames.StartIndex])
                : -1;
        },
        setStartIndex: function(value) {
            this.queryArgs[C.SDataUri.QueryArgNames.StartIndex] = value;

            return this;
        },
        getCount: function() {
            return this.queryArgs[C.SDataUri.QueryArgNames.Count]
                ? parseInt(this.queryArgs[C.SDataUri.QueryArgNames.Count])
                : -1;
        },
        setCount: function(value) {
            this.queryArgs[C.SDataUri.QueryArgNames.Count] = value;

            return this;
        },
        getIncludeContent: function() {
            var name = this.version.major >= 1
                ? C.SDataUri.QueryArgNames.IncludeContent
                : C.SDataUri.QueryArgNames.LegacyIncludeContent;

            return trueRE.test(this.queryArgs[name]);
        },
        setIncludeContent: function(value) {
            var name = this.version.major >= 1
                ? C.SDataUri.QueryArgNames.IncludeContent
                : C.SDataUri.QueryArgNames.LegacyIncludeContent;

            this.queryArgs[name] = "" + value;

            return this;
        },
        appendPath: function(value) {
            var segment = typeof value === 'string' ? {text: value} : value;

            this.pathSegments.push(segment);

            return this;
        },
        build: function(excludeQuery) {
            var url = [];

            url.push(this.getScheme() || C.SDataUri.Http);
            url.push(C.SDataUri.SchemeSuffix);
            url.push(C.SDataUri.PathSegmentPrefix);
            url.push(C.SDataUri.PathSegmentPrefix);
            url.push(this.getHost());

            if (this.getPort() > 0) url.push(C.SDataUri.PortPrefix, this.getPort());

            url.push(C.SDataUri.PathSegmentPrefix);

            var segments = this.getPathSegments();
            var path = [];

            var server = this.getServer();
            if (server && server.length > 0)
                path = path.concat(server.split('/'));

            for (var i = 0; i < segments.length; i++)
            {
                var segment = segments[i];
                if (segment && segment['text'])
                {
                    if (segment['predicate'])
                        path.push(encodeURIComponent(segment['text'] + '(' + segment['predicate'] + ')'));
                    else
                        path.push(encodeURIComponent(segment['text']));
                }
            }

            url.push(path.join(C.SDataUri.PathSegmentPrefix));

            if (excludeQuery) return url.join('');

            var queryArgs = this.getQueryArgs();
            var query = [];

            for (var key in queryArgs)
            {
                query.push(
                    encodeURIComponent(key) +
                    C.SDataUri.QueryArgValuePrefix +
                    encodeURIComponent(queryArgs[key])
                );
            }

            if (query.length > 0)
            {
                url.push(C.SDataUri.QueryPrefix);
                url.push(query.join(C.SDataUri.QueryArgPrefix));
            }

            return url.join('');
        },
        getProduct: function() {
            return this.getPathSegment(C.SDataUri.ProductPathIndex);
        },
        setProduct: function(val) {
            return this.setPathSegment(C.SDataUri.ProductPathIndex, val);
        },
        getContract: function() {
            return this.getPathSegment(C.SDataUri.ContractTypePathIndex);
        },
        setContract: function(val) {
            return this.setPathSegment(C.SDataUri.ContractTypePathIndex, val);
        },
        getCompanyDataset: function() {
            return this.getPathSegment(C.SDataUri.CompanyDatasetPathIndex);
        },
        setCompanyDataset: function(val) {
            return this.setPathSegment(C.SDataUri.CompanyDatasetPathIndex, val);
        },
        getCollectionType: function() {
            return this.getPathSegment(C.SDataUri.CollectionTypePathIndex);
        },
        setCollectionType: function(val) {
            return this.setPathSegment(C.SDataUri.CollectionTypePathIndex, val);
        },
        getCollectionPredicate: function() {
            var segment = this.getPathSegment(C.SDataUri.CollectionTypePathIndex);
            return (segment && segment['predicate']) || false;
        },
        setCollectionPredicate: function(value) {
            return this.setPathSegment(C.SDataUri.CollectionTypePathIndex, {
                predicate: value
            });
        }
    });

    Sage.apply(Sage.SData.Client.SDataUri, {
        Http: 'http',
        Https: 'https',
        PathSegmentPrefix: '/',
        PortPrefix: ':',
        QueryArgPrefix: '&',
        QueryArgValuePrefix: '=',
        QueryPrefix: '?',
        SchemeSuffix: ':',
        UnspecifiedPort: -1,
        UriName: 'uri',
        QueryArgNames: {
            Count: 'count',
            Exclude: 'exclude',
            Format: 'format',
            Include: 'include',
            IncludeContent: '_includeContent',
            LegacyIncludeContent: 'includeContent',
            IncludeSchema: 'includeSchema',
            Language: 'language',
            OrderBy: 'orderby',
            Precedence: 'precedence',
            ReturnDelta: 'returnDelta',
            Search: 'search',
            Select: 'select',
            StartIndex: 'startIndex',
            Thumbnail: 'thumbnail',
            TrackingID: 'trackingID',
            Where: 'where'
        },
        ProductPathIndex: 0,
        ContractTypePathIndex: 1,
        CompanyDatasetPathIndex: 2,
        CollectionTypePathIndex: 3,
        ResourcePropertyIndex: 4,
        ServiceMethodSegment: '$service',
        TemplateSegment: '$template',
        SystemSegment: '$system',
        NamedQuerySegment: '$queries',
        BatchSegment: '$batch'
    });
})();
/// <reference path="../libraries/ext/ext-core-debug.js"/>
/// <reference path="../libraries/ObjTree.js"/>
/// <reference path="../libraries/Base64.js"/>
/// <reference path="SDataBaseRequest.js"/>
/// <reference path="SDataApplicationRequest.js"/>
/// <reference path="SDataResourceCollectionRequest.js"/>
/// <reference path="SDataUri.js"/>

(function(){
    var S = Sage,
        C = Sage.namespace('Sage.SData.Client'),
        isDefined = function(value) { return typeof value !== 'undefined' };

    Sage.SData.Client.SDataService = Sage.Evented.extend({
        uri: null,
        useCredentialedRequest: false,
        userAgent: 'Sage',
        userName: false,
        password: '',
        batchScope: null,
        constructor: function(options) {
            /// <field name="uri" type="Sage.SData.Client.SDataUri" />
            this.base.apply(this, arguments);   
            
            this.uri = new Sage.SData.Client.SDataUri();

            if (options)
            {
                if (options.uri) this.uri = options.uri;
                if (options.version) this.uri.setVersion(options.version);
                if (options.serverName) this.uri.setHost(options.serverName);
                if (options.virtualDirectory) this.uri.setServer(options.virtualDirectory);
                if (options.applicationName) this.uri.setProduct(options.applicationName);
                if (options.contractName) this.uri.setContract(options.contractName);
                if (options.dataset) this.uri.setCompanyDataset(options.dataset);
                if (options.port) this.uri.setPort(options.port);
                if (options.protocol) this.uri.setScheme(options.protocol);

                if (typeof options.includeContent === 'boolean') this.uri.setIncludeContent(options.includeContent);

                if (options.json) this.json = true;
                if (options.userName) this.userName = options.userName;
                if (options.password) this.password = options.password;                
                if (options.useCredentialedRequest) this.useCredentialedRequest = true;

            }

            this.addEvents(
                'beforerequest',
                'requestcomplete',
                'requestexception',
                'requestaborted'
            );
        },
        isJsonEnabled: function() {
            return this.json;
        },
        enableJson: function() {
            this.json = true;
            return this;
        },
        disableJson: function() {
            this.json = false;
            return this;
        },
        getVersion: function() {
            return this.uri.getVersion();
        },
        setVersion: function(val) {
            this.uri.setVersion(val);
            return this;
        },
        getUri: function() {
            /// <returns type="Sage.SData.Client.SDataUri" />
            return this.uri;
        },
        getUserName: function() {
            /// <returns type="String" />
            return this.userName;
        },
        setUserName: function(value) {
            this.userName = value;
            return this;
        },
        getPassword: function() {
            return this.password;
        },
        setPassword: function(value) {
            this.password = value;
            return this;
        },
        getProtocol: function() {
            return this.uri.getScheme();
        },
        setProtocol: function(value) {
            this.uri.setScheme(value);
            return this;
        },
        getServerName: function() {
            return this.uri.getHost();
        },
        setServerName: function(value) {
            this.uri.setHost(value);
            return this;
        },
        getPort: function() {
            return this.uri.getPort();
        },
        setPort: function(value) {
            this.uri.setPort(value);
            return this;
        },
        getVirtualDirectory: function() {
            return this.uri.getServer();
        },
        setVirtualDirectory: function(value) {
            this.uri.setServer(value);
            return this;
        },
        getApplicationName: function() {
            return this.uri.getProduct();
        },
        setApplicationName: function(value) {
            this.uri.setProduct(value);
            return this;
        },
        getContractName: function() {
            return this.uri.getContract();
        },
        setContractName: function(value) {
            this.uri.setContract(value);
            return this;
        },
        getDataSet: function() {
            return this.uri.getCompanyDataset();
        },
        setDataSet: function(value) {
            this.uri.setCompanyDataset(value);
            return this;
        },
        getIncludeContent: function() {
            return this.uri.getIncludeContent();
        },
        setIncludeContent: function(value) {
            this.uri.setIncludeContent(value);
            return this;
        },
        getUserAgent: function() {
            return this.userAgent;
        },
        setUserAgent: function(value) {
            this.userAgent = value;
            return this;
        },
        registerBatchScope: function(scope) {
            this.batchScope = scope;
        },
        clearBatchScope: function(scope) {
            this.batchScope = null;
        },
        createBasicAuthToken: function() {
            return 'Basic ' + Base64.encode(this.userName + ":" + this.password);
        },
        createHeadersForRequest: function(request) {
            var headers = {
                /* 'User-Agent': this.userAgent */ /* 'User-Agent' cannot be set on XmlHttpRequest */
                'X-Authorization-Mode': 'no-challenge'
            };
            
            if (this.userName && !this.useCredentialedRequest)
                headers['Authorization'] = headers['X-Authorization'] = this.createBasicAuthToken();

            return headers;
        },
        executeRequest: function(request, options, ajax) {
            /// <param name="request" type="Sage.SData.Client.SDataBaseRequest">request object</param>
            var o = S.apply({
                headers: {},
                method: 'GET',
                async: options.async
            }, {
                scope: this,
                success: function(response, opt) {
                    var feed = this.processFeed(response);

                    this.fireEvent('requestcomplete', request, opt, feed);

                    if (options.success)
                        options.success.call(options.scope || this, feed);
                },
                failure: function(response, opt) {
                    this.fireEvent('requestexception', request, opt, response);

                    if (options.failure)
                        options.failure.call(options.scope || this, response, opt);
                },
                aborted: function(response, opt) {
                    this.fireEvent('requestaborted', request, opt, response);

                    if (options.aborted)
                        options.aborted.call(options.scope || this, response, opt);
                }
            }, ajax);

            S.apply(o.headers, this.createHeadersForRequest(request));
            
            if (this.userName && this.useCredentialedRequest)
            {
                o.user = this.userName;
                o.password = this.password;
            }

            // todo: temporary fix for SalesLogix Dynamic Adapter only supporting json selector in format parameter
            if (this.json) request.setQueryArg('format', 'json');

            o.url = request.build();

            this.fireEvent('beforerequest', request, o);

            /* if the event provided its own result, do not execute the ajax call */
            if (typeof o.result !== 'undefined')
            {
                if (options.success)
                    options.success.call(options.scope || this, o.result);

                return;
            }

            return C.Ajax.request(o);
        },
        abortRequest: function(id) {
            C.Ajax.cancel(id);
        },
        readFeed: function(request, options) {
            /// <param name="request" type="Sage.SData.Client.SDataResourceCollectionRequest">request object</param>
            options = options || {};

            return this.executeRequest(request, options, {
                headers: {
                    'Accept': this.json
                        ? 'application/json,*/*'
                        : 'application/atom+xml;type=feed,*/*'
                }
            });
        },
        readEntry: function(request, options) {
            /// <param name="request" type="Sage.SData.Client.SDataSingleResourceRequest">request object</param>
            options = options || {};

            if (this.batchScope)
            {
                this.batchScope.add({
                    url: request.build(),
                    method: 'GET'
                });

                return;
            }

            var o = S.apply({}, {
                success: function(feed) {
                    var entry = feed['$resources'][0] || false;

                    if (options.success)
                        options.success.call(options.scope || this, entry);
                }
            }, options);

            return this.executeRequest(request, o, {
                headers: {
                    'Accept': (this.json ? 'application/json' : 'application/atom+xml;type=entry') +  (request.accept? ';' + request.accept:'') //+ ',*/*' 
                }
            });
        },
        createEntry: function(request, entry, options) {
            options = options || {};

            if (this.batchScope)
            {
                this.batchScope.add({
                    url: request.build(),
                    entry: entry,
                    method: 'POST'
                });

                return;
            }            
            
            var o = S.apply({}, {
                success: function(feed) {
                    var entry = feed['$resources'][0] || false;

                    if (options.success)
                        options.success.call(options.scope || this, entry);
                }
            }, options);

            var ajax = S.apply({}, {
                method: 'POST'
            });

            if (this.isJsonEnabled())
            {
                S.apply(ajax, {
                    body: JSON.stringify(entry),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
            else
            {
                var xml = new XML.ObjTree();
                xml.attr_prefix = '@';

                S.apply(ajax, {
                    body: xml.writeXML(this.formatEntry(entry)),
                    headers: {
                        'Content-Type': 'application/atom+xml;type=entry',
                        'Accept': 'application/atom+xml;type=entry,*/*'
                    }
                });
            }

            return this.executeRequest(request, o, ajax);
        },
        updateEntry: function(request, entry, options) {
            /// <param name="request" type="Sage.SData.Client.SDataSingleResourceRequest">request object</param>
            options = options || {};

            if (this.batchScope)
            {
                this.batchScope.add({
                    url: request.build(),
                    entry: entry,
                    method: 'PUT',
                    etag: entry['$etag']
                });

                return;
            }

            var o = S.apply({}, {
                success: function(feed) {
                    var entry = feed['$resources'][0] || false;

                    if (options.success)
                        options.success.call(options.scope || this, entry);
                }
            }, options);

            var headers = {
                    'If-Match': entry['$etag'] // the 'If-Match' header MUST be present for PUT requests
                },
                ajax = {
                    method: 'PUT',
                    headers: headers
                };

            if (this.isJsonEnabled())
            {
                headers['Content-Type'] = 'application/json';

                ajax.body = JSON.stringify(entry);
            }
            else
            {
                var xml = new XML.ObjTree();
                xml.attr_prefix = '@';

                headers['Content-Type'] = 'application/atom+xml;type=entry';
                headers['Accept'] = 'application/atom+xml;type=entry,*/*';

                ajax.body = xml.writeXML(this.formatEntry(entry));
            }

            return this.executeRequest(request, o, ajax);
        },
        deleteEntry: function(request, entry, options) {
            /// <param name="request" type="Sage.SData.Client.SDataSingleResourceRequest">request object</param>
            options = options || {};

            if (this.batchScope)
            {
                this.batchScope.add({
                    url: request.build(),
                    method: 'DELETE',
                    etag: !(options && options.ignoreETag) && entry['$etag']
                });

                return;
            }

            var headers = {},
                ajax = {
                    method: 'DELETE',
                    headers: headers
                };

            if (entry['$etag'] && !(options && options.ignoreETag))
                headers['If-Match'] = entry['$etag'];

            return this.executeRequest(request, options, ajax);
        },
        executeServiceOperation: function(request, entry, options) {
             var o = S.apply({}, {
                success: function(feed) {
                    var entry = feed['$resources'][0] || false,
                        response = entry && entry['response'],
                        resources = response && response['$resources'],
                        payload = resources && resources[0];

                    if (payload && payload['$name'])
                    {
                        entry['response'] = {};
                        entry['response'][payload['$name']] = payload;
                    }

                    if (options.success)
                        options.success.call(options.scope || this, entry);
                }
            }, options);

            var ajax = S.apply({}, {
                method: 'POST'
            });

            if (this.isJsonEnabled())
            {
                S.apply(ajax, {
                    body: JSON.stringify(entry),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
            else
            {
                var xml = new XML.ObjTree();
                xml.attr_prefix = '@';

                S.apply(ajax, {
                    body: xml.writeXML(this.formatEntry(entry)),
                    headers: {
                        'Content-Type': 'application/atom+xml;type=entry',
                        'Accept': 'application/atom+xml;type=entry,*/*'
                    }
                });
            }

            return this.executeRequest(request, o, ajax);
        },
        commitBatch: function(request, options) {
            options = options || {};

            var item,
                entry,
                feed = {
                    '$resources': []
                };

            for (var i = 0; i < request.items.length; i++)
            {
                item = request.items[i];
                entry = S.apply({}, item.entry); /* only need a shallow copy as only top-level properties will be modified */

                if (item.url) entry['$url'] = item.url;
                if (item.etag) entry['$ifMatch'] = item.etag;
                if (item.method) entry['$httpMethod'] = item.method;

                delete entry['$etag'];

                feed['$resources'].push(entry);
            }

            var ajax = S.apply({}, {
                method: 'POST'
            });

            if (this.isJsonEnabled())
            {
                S.apply(ajax, {
                    body: JSON.stringify(feed),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
            else
            {
                var xml = new XML.ObjTree();
                xml.attr_prefix = '@';

                S.apply(ajax, {
                    body: xml.writeXML(this.formatFeed(feed)),
                    headers: {
                        'Content-Type': 'application/atom+xml;type=feed',
                        'Accept': 'application/atom+xml;type=feed,*/*'
                    }
                });
            }

            return this.executeRequest(request, options, ajax);
        },
        parseFeedXml: function(text) {
            var xml = new XML.ObjTree();
            xml.attr_prefix = '@';

            return xml.parseXML(text);
        },
        isIncludedReference: function(ns, name, value) {
            return value.hasOwnProperty('@sdata:key');
        },
        isIncludedCollection: function(ns, name, value) {
            if (value.hasOwnProperty('@sdata:key')) return false;
            if (value.hasOwnProperty('@sdata:uri') || value.hasOwnProperty('@sdata:url')) return true;

            // attempt to detect if we are dealing with an included relationship collection
            var firstChild,
                firstValue;

            for (var fqPropertyName in value)
            {
                firstChild = value[fqPropertyName];
                break; // will always ever be one property, either an entity, or an array of
            }

            if (firstChild)
            {
                if (S.isArray(firstChild))
                    firstValue = firstChild[0];
                else
                    firstValue = firstChild;
                
                if (firstValue && firstValue.hasOwnProperty('@sdata:key')) return true;
            }

            return false;
        },
        convertEntity: function(ns, name, entity, applyTo) {
            applyTo = applyTo || {};

            applyTo['$name'] = name;
            applyTo['$key'] = entity['@sdata:key'];
            applyTo['$url'] = entity['@sdata:uri'];
            applyTo['$uuid'] = entity['@sdata:uuid'];

            var prefix = ns ? ns + ':' : false;

            for (var fqPropertyName in entity)
            {
                if (fqPropertyName[0] === '@') continue;

                if (!prefix || fqPropertyName.indexOf(prefix) === 0)
                {
                    var propertyName = prefix ? fqPropertyName.substring(prefix.length) : fqPropertyName,
                        value = entity[fqPropertyName];

                    if (typeof value === 'object')
                    {
                        if (value.hasOwnProperty('@xsi:nil')) // null
                        {
                            var converted = null;
                        }
                        else if (this.isIncludedReference(ns, propertyName, value)) // included reference
                        {
                            var converted = this.convertEntity(ns, propertyName, value);
                        }
                        else if (this.isIncludedCollection(ns, propertyName, value)) // included collection
                        {
                            var converted = this.convertEntityCollection(ns, propertyName, value);
                        }
                        else // no conversion, read only
                        {                            
                            converted = this.convertCustomEntityProperty(ns, propertyName, value);
                        }

                        value = converted;
                    }

                    applyTo[propertyName] = value;
                }
            }

            return applyTo;
        },
        convertEntityCollection: function(ns, name, collection) {
            var prefix = ns ? ns + ':' : false;

            for (var fqPropertyName in collection)
            {
                if (!prefix || fqPropertyName.indexOf(prefix) === 0)
                {
                    var propertyName = prefix ? fqPropertyName.substring(prefix.length) : fqPropertyName,
                        value = collection[fqPropertyName];

                    if (S.isArray(value))
                    {
                        var converted = [];

                        for (var i = 0; i < value.length; i++)
                            converted.push(this.convertEntity(ns, propertyName, value[i]));

                        return {
                            '$resources': converted
                        };
                    }
                    else
                    {
                        return {
                            '$resources': [
                                this.convertEntity(ns, propertyName, value)
                            ]
                        };
                    }

                    break; // will always ever be one property, either an entity, or an array of
                }
            }

            return null;
        },
        convertCustomEntityProperty: function(ns, name, value) {
            return value;
        },
        formatEntity: function(ns, entity, applyTo) {
            applyTo = applyTo || {};

            if (entity['$key']) applyTo['@sdata:key'] = entity['$key'];
       
            // todo: is this necessary? does not appear to be looking at the spec
            // if (entity['$url']) applyTo['@sdata:uri'] = entity['$url'];

            // note: not using explicit namespaces at this time

            for (var propertyName in entity)
            {
                if (propertyName[0] === '$') continue;

                var value = entity[propertyName];

                if (value == null)
                {
                    value = {'@xsi:nil': 'true'};
                }
                else if (typeof value === 'object' && value.hasOwnProperty('$resources'))
                {
                    // todo: add resource collection support
                    value = this.formatEntityCollection(ns, value);
                }
                else if (typeof value === 'object')
                {
                    value = this.formatEntity(ns, value);
                }

                applyTo[propertyName] = value;
            }

            return applyTo;
        },
        formatEntityCollection: function(ns, value) {
            var result = {};

            for (var i = 0; i < value['$resources'].length; i++)
            {
                var item = value['$resources'][i],
                    name = item['$name'],
                    target = (result[name] = result[name] || []);

                target.push(this.formatEntity(ns, value['$resources'][i]));
            }

            return result;
        },
        convertEntry: function(entry) {
            var result = {};

            result['$descriptor'] = entry['title'];
            result['$etag'] = entry['http:etag'];
            result['$httpStatus'] = entry['http:httpStatus'];

            var payload = entry['sdata:payload'];

            for (var key in payload)
            {
                if (payload.hasOwnProperty(key) == false) continue;

                var parts = key.split(':'),
                    ns,
                    name,
                    entity = payload[key];

                if (parts.length == 2)
                {
                    ns = parts[0];
                    name = parts[1];
                }
                else if (parts.length < 2)
                {
                    ns = false;
                    name = key;
                }
                else
                {
                    continue;
                }   

                this.convertEntity(ns, name, entity, result);
            }

            return result;
        },
        formatEntry: function(entry, excludeNS) {
            var result = {};

            if (!excludeNS)
            {
                result['@xmlns:sdata'] = 'http://schemas.sage.com/sdata/2008/1';
                result['@xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
                result['@xmlns:http'] = 'http://schemas.sage.com/sdata/http/2008/1';
                result['@xmlns'] = 'http://www.w3.org/2005/Atom';
            }

            if (entry['$httpMethod']) result['http:httpMethod'] = entry['$httpMethod'];
            if (entry['$ifMatch']) result['http:ifMatch'] = entry['$ifMatch'];
            if (entry['$etag']) result['http:etag'] = entry['$etag'];
            if (entry['$url']) result['id'] = entry['$url'];

            result['sdata:payload'] = {};
            result['sdata:payload'][entry['$name']] = {
                '@xmlns': 'http://schemas.sage.com/dynamic/2007'
            };

            this.formatEntity(false, entry, result['sdata:payload'][entry['$name']]);

            return {'entry': result};
        },
        convertFeed: function(feed) {
            var result = {};

            if (feed['opensearch:totalResults'])
                result['$totalResults'] = parseInt(feed['opensearch:totalResults']);

            if (feed['opensearch:startIndex'])
                result['$startIndex'] = parseInt(feed['opensearch:startIndex']);

            if (feed['opensearch:itemsPerPage'])
                result['$itemsPerPage'] = parseInt(feed['opensearch:itemsPerPage']);

            if (feed['link'])
            {
                result['$link'] = {};
                for (var i = 0; i < feed['link'].length; i++)
                    result['$link'][feed['link'][i]['@rel']] = feed['link'][i]['@href'];

                if (result['$link']['self'])
                    result['$url'] = result['$link']['self'];
            }

            result['$resources'] = [];

            if (S.isArray(feed['entry']))
                for (var i = 0; i < feed['entry'].length; i++)
                    result['$resources'].push(this.convertEntry(feed['entry'][i]));
            else if (typeof feed['entry'] === 'object')
                result['$resources'].push(this.convertEntry(feed['entry']));

            return result;
        },
        formatFeed: function(feed) {
            var result = {};

            result['@xmlns:sdata'] = 'http://schemas.sage.com/sdata/2008/1';
            result['@xmlns:xsi'] = 'http://www.w3.org/2001/XMLSchema-instance';
            result['@xmlns:http'] = 'http://schemas.sage.com/sdata/http/2008/1';
            result['@xmlns'] = 'http://www.w3.org/2005/Atom';

            if (feed['$url']) result['id'] = feed['$url'];

            result['entry'] = [];

            for (var i = 0; i < feed['$resources'].length; i++)
            {
                result['entry'].push(this.formatEntry(feed['$resources'][i], true)['entry']);
            }

            return {'feed': result};
        },
        processFeed: function(response) {
            if (!response.responseText) return null;

            var contentType = response.getResponseHeader && response.getResponseHeader('Content-Type');
            
            if ((contentType.indexOf('application/json', 0) >= 0) || (!contentType && this.isJsonEnabled()))
            {
                var doc = JSON.parse(response.responseText);

                // doing this for parity with below, since with JSON, SData will always
                // adhere to the format, regardless of the User-Agent.
                if (doc.hasOwnProperty('$resources'))
                {
                    return doc;
                }
                else
                {
                    return {
                        '$resources': [doc]
                    };
                }
            }
            else
            {
                var doc = this.parseFeedXml(response.responseText);

                // depending on the User-Agent the SIF will either send back a feed, or a single entry
                // todo: is this the right way to handle this? should there be better detection?
                if (doc.hasOwnProperty('feed'))
                    return this.convertFeed(doc['feed']);
                else if (doc.hasOwnProperty('entry'))
                    return {
                        '$resources': [
                            this.convertEntry(doc['entry'])
                        ]
                    };
                else
                    return false;
            }
        }
    });
})();
