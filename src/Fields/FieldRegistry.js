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

define('argos/Fields/FieldRegistry', [
    'dojo/_base/lang',
    'require'
], function(
    lang,
    require
) {
    /**
     * Field Registry is a map of field types to their constructors that enables the Edit View layouts to
     * simply define `type: 'myFieldType'`.
     * @alternateClassName FieldRegistry
     * @singleton
     */
    var FieldRegistry = lang.setObject('argos.Fields.FieldRegistry', {
        /**
         * @property {Object}
         * Collection of field type names (keys) and their respective constructor functions (values).
         */
        fromType: {},
        /**
         * @property {Function}
         * Default field constructor to use if the requested field type name is not registered and no fallback
         * constructor is provided.
         */
        defaultType: null,
        /**
         * Returns a field constructor for the given type name.
         *
         * If name is not found a fallback constructor may be provided, if not the default constructor will be returned.
         *
         * @param {String/Object} props Name of the field type to return. If an object is given the name will be
         * extracted from it's object.type.
         * @param {Function} fallback A fallback field constructor if the field type name is not found.
         * @return {Function} Constructor for the field type name.
         */
        getFieldFor: function(props, fallback) {
            var name = typeof props == 'string'
                ? props
                : props['type'];
            return this.fromType[name] || ((fallback !== false) && this.defaultType);
        },
        /**
         * Registers a given unique type name with a field constructor.
         *
         * If the type is provided as an object it is treated as a map of multiple type names and constructors and is
         * merged in.
         *
         * Edit Views layout objects will use this register when defining `type` of a field:
         *
         *     {
         *         name: '',
         *         property: '',
         *         label: '',
         *         type: 'fieldType' // this is used with the register to access the constructor
         *     }
         *
         * @param {String/Object} type Unique name of the field to register.
         * @param {Function} ctor Constructor of the field being registered.
         */
        register: function(type, ctor) {
            if (lang.isObject(type))
                lang.mixin(this.fromType, type);
            else if (lang.isString(type) && ctor)
                this.fromType[type] = ctor;
        }
    });

    require([
        './BooleanField',
        './CameraField',
        './DateField',
        './DecimalField',
        './DurationField',
        './HiddenField',
        './LookupField',
        './PhoneField',
        './SelectField',
        './SignatureField',
        './TextAreaField',
        './TextField',
        './ValueOnlyField',
        './CollectionEntryField'
    ], function(
        BooleanField,
        CameraField,
        DateField,
        DecimalField,
        DurationField,
        HiddenField,
        LookupField,
        PhoneField,
        SelectField,
        SignatureField,
        TextAreaField,
        TextField,
        ValueOnlyField,
        CollectionEntryField
    ) {
        lang.mixin(FieldRegistry.fromType, {
            'boolean': BooleanField,
            'camera': CameraField,
            'date': DateField,
            'decimal': DecimalField,
            'duration': DurationField,
            'hidden': HiddenField,
            'lookup': LookupField,
            'phone': PhoneField,
            'select': SelectField,
            'signature': SignatureField,
            'textarea': TextAreaField,
            'text': TextField,
            'valueOnly': ValueOnlyField,
            'collection-entry': CollectionEntryField
        });

        FieldRegistry.defaultType = TextField;
    });

    return FieldRegistry;
});