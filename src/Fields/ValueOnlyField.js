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
 *
 * The ValueOnlyField is a simple storage mechanism for values you wish to store, pass, use, manipulate
 * without having to display it.
 *
 * Whereas {@link HiddenField HiddenField} actually sets the value to an
 * input field (meaning string only) ValueOnly keeps the given value, no matter the type in memory.
 *
 * ###Example:
 *     {
 *         name: 'HistorySECCode',
 *         property: 'HistorySECCode',
 *         type: 'valueOnly'
 *     }
 *
 * @alternateClassName ValueOnlyField
 * @extends _Field
 */
define('argos/Fields/ValueOnlyField', [
    'dojo/_base/declare',
    './_Field'
], function(
    declare,
    _Field
) {
    /* todo: figure out a way to not do any rendering for this field. */
    return declare('argos.Fields.ValueOnlyField', [_Field], {
        /**
         * @property {Simplate}
         * Simplate that defines the rows (field containers) HTML Markup.
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
         * Simplate that defines the fields HTML Markup.
         *
         * * `$` => Field instance
         * * `$$` => Owner View instance
         *
         */
        widgetTemplate: new Simplate([
            '<input data-dojo-attach-point="inputNode" type="hidden">'
        ]),

        /**
         * @property {Object/String/Number/Boolean}
         * The value being stored.
         */
        currentValue: null,

        /**
         * Merely returns the stored value from memory.
         * @return {Object/String/Number/Boolean}
         */
        getValue: function() {
            return this.currentValue;
        },

        /**
         * Sets the value in memory
         * @param {Object/String/Number/Boolean} val Value to be stored.
         */
        setValue: function(val) {
            this.currentValue = val;
        },

        /**
         * Clears the value by setting the `currentValue` to null.
         */
        clearValue: function() {
            this.setValue(null);
        }
    });
});