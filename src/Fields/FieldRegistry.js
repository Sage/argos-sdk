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
    './TextField'
], function(
    lang,
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
    TextField
) {
    var fromType = {
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
        'text': TextField
    };
    return lang.setObject('Sage.Platform.Mobile.Fields.FieldRegistry', {
        fromType: fromType,
        getFieldFor: function(props, fallback) {
            var name = typeof props == 'string'
                ? props
                : props['type'];
            return this.fromType[name] || ((fallback !== false) && TextField);
        },
        register: function(type, ctor) {
            fromType[type] = ctor;
        }
    });
});