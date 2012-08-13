define('Sage/Platform/Mobile/_SDataListMixin', [
    'dojo/_base/declare',
    './Store/SData',
    './Utility'
], function(
    declare,
    SData,
    utility
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
            return new SData({
                service: this.getConnection(),
                contractName: this.contractName,
                resourceKind: this.resourceKind,
                resourceProperty: this.resourceProperty,
                resourcePredicate: this.resourcePredicate,
                include: this.queryInclude,
                select: this.querySelect,
                where: this.queryWhere,
                orderBy: this.queryOrderBy,
                idProperty: this.keyProperty,
                scope: this
            });
        },
        _buildQueryExpression: function() {
            var options = this.options,
                passed = options && (options.query || options.where);

            return passed
                ? this.query
                    ? '(' + utility.expand(this, passed) + ') and (' + this.query + ')'
                    : '(' + utility.expand(this, passed) + ')'
                : this.query;
        },
        _applyStateToQueryOptions: function(queryOptions) {
            var options = this.options;
            if (options)
            {
                if (options.select) queryOptions.select = options.select;
                if (options.include) queryOptions.include = options.include;
                if (options.orderBy) queryOptions.sort = options.orderBy;
                if (options.contractName) queryOptions.contractName = options.contractName;
                if (options.resourceKind) queryOptions.resourceKind = options.resourceKind;
                if (options.resourceProperty) queryOptions.resourceProperty = options.resourceProperty;
                if (options.resourcePredicate) queryOptions.resourcePredicate = options.resourcePredicate;
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