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
 * _SDataEditMixin enables SData for the Edit view.
 *
 * Extends the SDataDetail Mixin by providing functions for $template requests.
 *
 * @alternateClassName _SDataEditMixin
 * @extends _SDataDetailMixin
 * @requires SData
 */
define('argos/_SDataEditMixin', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/string',
    'dojo/dom-class',
    './Store/SData',
    './_SDataDetailMixin'
], function(
    declare,
    lang,
    string,
    domClass,
    SData,
    _SDataDetailMixin
) {
    return declare('argos._SDataEditMixin', [_SDataDetailMixin], {
        _buildRefreshMessage: function(item, result) {
            var message = this.inherited(arguments);

            return lang.mixin(message, {
                resourceKind: this.resourceKind
            });
        },
        _onRequestTemplateFailure: function(xhr, xhrOptions) {
            var error = new Error('An error occurred requesting: ' + xhrOptions.url);

            error.xhr = xhr;
            error.status = xhr.status;
            error.responseText = xhr.responseText;

            this._onGetError({}, error);
        },
        _onRequestTemplateSuccess: function(template) {
            this._processTemplateData(template);
        },
        _requestTemplateData: function() {
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
        },
        _applyStateToPutOptions: function(putOptions) {
            var store = this.get('store');

            putOptions.version = store.getVersion(this.item);
            putOptions.entity = store.getEntity(this.item) || this.entityName;
        },
        _applyStateToAddOptions: function(addOptions) {
            addOptions.entity = this.entityName;
        }
    });
});