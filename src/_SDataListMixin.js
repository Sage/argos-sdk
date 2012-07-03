define('Sage/Platform/Mobile/_SDataListMixin', [
    'dojo/_base/declare',
    './Data/SDataStore'
], function(
    declare,
    SDataStore
) {
    /**
     * SData enablement for the List view.
     */
    return declare('Sage.Platform.Mobile._SDataListMixin', null, {
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
         * The default order by expression for an SData request.
         * @type {String}
         */
        queryOrderBy: null,
        /**
         * The default where expression for an SData request.
         * @type {String|Function}
         */
        queryWhere: null,
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
            return new SDataStore({
                service: this.getConnection(),
                contractName: this.expandExpression(this.contractName),
                resourceKind: this.expandExpression(this.resourceKind),
                resourceProperty: this.expandExpression(this.resourceProperty),
                resourcePredicate: this.expandExpression(this.resourcePredicate),
                include: this.expandExpression(this.queryInclude),
                select: this.expandExpression(this.querySelect),
                where: this.expandExpression(this.queryWhere),
                orderBy: this.expandExpression(this.queryOrderBy),
                labelAttribute: this.descriptorProperty,
                identityAttribute: this.keyProperty
            });
        },
        applyOptionsToFetch: function(keywordArgs) {
            var options = this.options;
            if (options)
            {
                if (options.where) keywordArgs.query = keywordArgs.query
                    ? '(' + this.expandExpression(options.where) + ') and (' + keywordArgs.query + ')'
                    : '(' + this.expandExpression(options.where) + ')';
                if (options.select) keywordArgs.select = this.expandExpression(options.select);
                if (options.include) keywordArgs.include = this.expandExpression(options.include);
                if (options.orderBy) keywordArgs.sort = parseOrderBy(this.expandExpression(options.orderBy));
                if (options.contractName) keywordArgs.contractName = this.expandExpression(options.contractName);
                if (options.resourceKind) keywordArgs.resourceKind = this.expandExpression(options.resourceKind);
                if (options.resourceProperty) keywordArgs.resourceProperty = this.expandExpression(options.resourceProperty);
                if (options.resourcePredicate) keywordArgs.resourcePredicate = this.expandExpression(options.resourcePredicate);
            }
        },
        formatSearchQuery: function(query) {
            return false;
        },
        formatHashTagQuery: function(query) {
            var layout = this.get('hashTags') || [],
                queries = [],
                additional = query;

            this.hashTagSearchRE.lastIndex = 0;

            var match;
            while (match = this.hashTagSearchRE.exec(query))
            {
                var tag = match[1],
                    expression = null;

                // todo: can optimize later if necessary
                for (var i = 0; i < layout.length && !expression; i++)
                {
                    if (layout[i].tag == tag) expression = layout[i].query;
                }

                if (!expression) continue;

                queries.push(this.expandExpression(expression));

                additional = additional.replace(match[0], '');
            }

            if (queries.length < 1) return this.formatSearchQuery(query);

            query = '(' + queries.join(') and (') + ')';

            additional = additional.replace(/^\s+|\s+$/g, '');

            if (additional)
            {
                query += ' and (' + this.formatSearchQuery(additional) + ')';
            }

            return query;
        },
        escapeSearchQuery: function(query) {
            return (query || '').replace(/"/g, '""');
        }
    });
});