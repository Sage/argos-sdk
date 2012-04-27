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

define('Sage/Platform/Mobile/_ScrollViewMixin', [
    'dojo/_base/declare',
    'dojo/_base/lang'
], function(
    declare,
    lang
) {
    return declare('Sage.Platform.Mobile._ScrollViewMixin', null, {
        scrollContainerNode: null,
        _scroll: null,
        startup: function() {
            this.inherited(arguments);

            if (this.scrollContainerNode)
            {
                this._scroll = new iScroll(this.scrollContainerNode, {});
            }
        },
        resize: function() {
            this.inherited(arguments);

            console.log('resize!');

            if (this._scroll)
                this._scroll.refresh();
        }
    });

});