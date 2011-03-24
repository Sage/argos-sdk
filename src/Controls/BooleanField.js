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
    Sage.Platform.Mobile.Controls.BooleanField = Ext.extend(Sage.Platform.Mobile.Controls.Field, {        
        template: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<div class="toggle" toggled="{%= !!$.checked %}">',
            '<span class="thumb"></span>',
            '<span class="toggleOn">{%= $.onText %}</span>',
            '<span class="toggleOff">{%= $.offText %}</span>',
            '</div>'
        ]),        
        onText: 'ON',
        offText: 'OFF',
        init: function() {
            Sage.Platform.Mobile.Controls.BooleanField.superclass.init.apply(this, arguments);

            this.el.on('click', this.onClick, this, {stopEvent: true});
        },
        onClick: function(evt, el, o) {
            if (this.isDisabled()) return;

            var toggledValue = this.el.getAttribute('toggled') !== 'true';

            this.el.dom.setAttribute('toggled', toggledValue);

            this.fireEvent('change', toggledValue, this);
        },
        getValue: function() {
            return this.el.getAttribute('toggled') === 'true';
        },
        setValue: function(val, initial) {
            val = typeof val === 'string'
                ? /^true$/i.test(val)
                : !!val;

            if (initial) this.originalValue = val;

            this.el.dom.setAttribute('toggled', val.toString());
        },
        clearValue: function(flag) {
            var initial = flag !== true;

            this.setValue(this.checked, initial);
        },
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });

    Sage.Platform.Mobile.Controls.FieldManager.register('boolean', Sage.Platform.Mobile.Controls.BooleanField);
})();