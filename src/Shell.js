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

define('Sage/Platform/Mobile/Shell', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojox/mobile/FixedSplitter',
    'dojox/mobile/FixedSplitterPane',
    './_Component'
], function(
    declare,
    lang,
    FixedSplitter,
    FixedSplitterPane,
    _Component
) {
    return declare('Sage.Platform.Mobile.Shell', [FixedSplitter, _Component], {
        orientation: 'H',
        components: [
            {type: 'dojox.mobile.FixedSplitterPane', attachPoint: 'left', attachEvent: {}, props:{'class':'shell-left'}},
            {type: 'dojox.mobile.FixedSplitterPane', attachPoint: 'center', attachEvent: {}, props:{'class':'shell-center'}},
            {type: 'dojox.mobile.FixedSplitterPane', attachPoint: 'right', attachEvent: {}, props:{'class':'shell-right'}}
        ],
        postCreate: function() {
            /* todo: buffer this? */
            this.connect(window, 'onresize', this.resize);
        },
        startup: function() {
            this.inherited(arguments);
        },
        show: function(view, at, options) {
        }
    });
});