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

Ext.namespace('Sage.Platform.Mobile.Controls');

(function() {
    Sage.Platform.Mobile.Controls.HiddenField = Ext.extend(Sage.Platform.Mobile.Controls.TextField, {
        propertyTemplate: new Simplate([
            '<div style="display: none;" data-field="{%= $.name %}" data-field-type="{%= $.type %}">',
            '</div>'
        ]),
        template: new Simplate([
            '<input type="hidden">'
        ]),
        bind: function() {
            // call field's bind. we don't want event handlers for this.
            Sage.Platform.Mobile.Controls.Field.prototype.bind.apply(this, arguments);
        }       
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('hidden', Sage.Platform.Mobile.Controls.HiddenField);
})();