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
 * The Hidden Field is {@link TextField TextField} but instead uses `<input type="hidden"`>.
 *
 * Meaning that the field will not be displayed on screen but may still store strings of text.
 *
 * ###Example:
 *     {
 *         name: 'StatusCodeKey',
 *         property: 'StatusCodeKey',
 *         type: 'hidden'
 *     }
 *
 * @alternateClassName HiddenField
 * @extends TextField
 */
define('argos/Fields/HiddenField', [
    'dojo/_base/declare',
    './TextField'
], function(
    declare,
    TextField
) {
    return declare('argos.Fields.HiddenField', [TextField], {
        /**
         * @property {Simplate}
         * Simplate that defines the rows (field containers) HTML Markup
         *
         * * `$` => Field instance
         * * `$$` => Owner View instance
         *
         */
        rowTemplate: new Simplate([
            '<div style="display: none;" data-field="{%= $.name || $.property %}" data-field-type="{%= $.type %}">',
            '</div>'
        ]),
        /**
         * @property {Simplate}
         * Simplate that defines the fields HTML Markup
         *
         * * `$` => Field instance
         * * `$$` => Owner View instance
         *
         */
        widgetTemplate: new Simplate([
            '<input data-dojo-attach-point="inputNode" type="hidden">'
        ])
    });
});