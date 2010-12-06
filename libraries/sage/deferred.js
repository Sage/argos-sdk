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

/*global Sage $ alert*/
if(Sage) {
    (function(S) {
        // place the Deferred class into Sage.Utility
        S.namespace('Utility');
        
        S.Utility.Deferred = function(fn, args, scope) {
            var that = this, id,
            c = function() {
                clearInterval(id);
                id = null;
                fn.apply(scope, args || []);
            };
            that.delay = function(n) {
                that.cancel();
                // an named interval that can be cancelled
                id = setInterval(c, n);
            };
            that.cancel = function() {
                if(id) {
                    clearInterval(id);
                    id = null;
                }
            };
        };
    }(Sage));
}