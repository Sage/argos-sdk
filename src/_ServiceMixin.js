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
 * @alternateClassName _ServiceMixin
 * @deprecated
 */
define('Sage/Platform/Mobile/_ServiceMixin', [
    'dojo/_base/declare'
], function(
    declare
) {

    return declare('Sage.Platform.Mobile._ServiceMixin', null, {
        serviceMap: null,
        constructor: function() {
            var map = this.serviceMap;
            console.log(map);
            if (map)
            {
                for (var property in map)
                {
                    if (this[property]) continue; /* skip any that were explicitly mixed in */

                    this[property] = this._resolveService(map[property]);
                }
            }
        },
        _resolveService: function(specification) {
            if (specification && specification.type === 'sdata')
                return App.getService(specification.name);

            return App.getService(specification);
        }
    });
});