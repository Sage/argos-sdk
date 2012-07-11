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

define('Sage/Platform/Mobile/Fields/GeneratorField', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'dojo/string',
    './_Field',
    'Sage/Platform/Mobile/Fields/FieldRegistry'
], function(
    declare,
    lang,
    domConstruct,
    string,
    _Field,
    FieldRegistry
) {
    return declare('Sage.Platform.Mobile.Fields.GeneratorField', [_Field], {
        propertyTemplate: new Simplate([
            '<div class="generator-container" data-field="{%= $.name || $.property %}"></div>'
        ]),

        fieldTemplate: new Simplate([
            '{% console.log($,$$); %}',
            '<div class="generator-field row row-edit {%= $$.cls %}" data-field-type="{%= $$.fieldType %}">',
                '{% if ($$.removable) { %}',
                '{%! $$.removeButtonTemplate %}',
                '{% } %}',
            '</div>'
        ]),


        /**
         * Field Class that will be generated
         */
        fieldType: null,

        /**
         * Field Options that will be passed to the Field constructor
         */
        fieldOpts: null,

        /**
         * Hash of generated fields accessible via the fields name
         */
        fields: null,

        /**
         * Number of fields to generate by default
         */
        initialCount: 1,


        constructor: function(o) {
            this.fields = {};
        },

        startup: function() {
            this.inherited(arguments);
            for (var i = 0; i < this.initialCount; i++)
                this.addField();
        },

        generateField: function() {
            var ctor = Sage.Platform.Mobile.Fields.FieldRegistry.getFieldFor(this.fieldType, false),
                field = this.fields[this.fieldOpts['name'] || this.fieldOpts['property']] = new ctor(lang.mixin({
                    owner: this
                }, this.fieldOpts));
            return field;
        },

        addField: function() {
            var field = this.generateField(),
                fieldNode = domConstruct.place(this.fieldTemplate.apply(field, this), this.containerNode, 'last');

            field.renderTo(fieldNode);
            field.startup();
        },
        removeField: function(name) {
            var field = this.fields[name];
            if (!field) return;

            field.destroy();
            delete this.fields[name];
        },

        onAddField: function() {
            // stub for binding
        },
        onRemoveField: function() {
            // stub for binding
        },

        setValue: function(val) {
            // generate field for each val
            // populate fields
        },
        getValue: function() {
            // collect field values
        }
    });
});