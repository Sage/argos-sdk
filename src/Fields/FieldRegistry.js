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

define('Sage/Platform/Mobile/Fields/FieldRegistry', [
    'dojo/_base/lang',
    'require'
], function(
    lang,
    require
) {
    var FieldRegistry = lang.setObject('Sage.Platform.Mobile.Fields.FieldRegistry', {
        fromType: {},
        defaultType: null,
        getFieldFor: function(props, fallback) {
            var name = typeof props == 'string'
                ? props
                : props['type'];
            return this.fromType[name] || ((fallback !== false) && this.defaultType);
        },
        register: function(type, ctor) {
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
        './NoteField',
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
        NoteField,
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
            'note': NoteField,
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