/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define('Sage/Platform/Mobile/WithSData', [
    'dojo/_base/lang',
    './Data/SDataStore',
    './List',
    './Detail',
    './Edit'
], function(
    lang,
    SDataStore,
    List,
    Detail,
    Edit
) {
    /**
     * SData enablement for the List view.
     */
    lang.extend(List, {
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
        applyOptionsToKeywordArgs: function(keywordArgs) {
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

    /**
     * SData enablement for the Detail view.
     */
    lang.extend(Detail, {
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
            return new SDataStore({
                service: this.getConnection(),
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
        applyOptionsToKeywordArgs: function(keywordArgs) {
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
        }
    });

    return {
        List: List,
        Detail: Detail,
        Edit: Edit
    };
});