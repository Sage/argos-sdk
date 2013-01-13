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

/**
 * _SDataDetailMixin enables SData for the Detail view.
 *
 * Adds the SData store to the view and exposes the needed properties for creating a Entry request.
 *
 * @alternateClassName _SDataDetailMixin
 * @requires SData
 */
define('argos/_SDataDetailMixin', [
    'dojo/_base/declare',
    './Store/SData'
], function(
    declare,
    SData
) {
    return declare('argos._SDataDetailMixin', null, {
        /**
         * @cfg {String} resourceKind
         * The SData resource kind the view is responsible for.  This will be used as the default resource kind
         * for all SData requests.
         */
        resourceKind: '',
        /**
         * @cfg {String[]}
         * A list of fields to be selected in an SData request.
         */
        querySelect: null,
        /**
         * @cfg {String[]?}
         * A list of child properties to be included in an SData request.
         */
        queryInclude: null,
        /**
         * @cfg {String?/Function?}
         * The default resource property for an SData request.
         */
        resourceProperty: null,
        /**
         * @cfg {String?/Function?}
         * The default resource predicate for an SData request.
         */
        resourcePredicate: null,
        keyProperty: '$key',
        descriptorProperty: '$descriptor',
        createStore: function() {
            return new SData({
                service: this.getConnection(),
                contractName: this.contractName,
                dataSet: this.dataSet,
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