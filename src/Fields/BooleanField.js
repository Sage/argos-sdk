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

define('Sage/Platform/Mobile/Fields/BooleanField', [
    'dojo/_base/declare',
    'dojo/dom-attr',
    'dojo/dom-class',
    '../_TemplatedWidgetMixin',
    './_Field'
], function(
    declare,
    domAttr,
    domClass,
    _TemplatedWidgetMixin,
    _Field
) {
    return declare('Sage.Platform.Mobile.Fields.BooleanField', [_Field, _TemplatedWidgetMixin], {
        attributeMap: {
            toggled:{
                node: 'toggleNode',
                type: 'attribute',
                attribute: 'toggled'
            }
        },
        widgetTemplate: new Simplate([
            '<div class="toggle" data-dojo-attach-point="toggleNode" data-dojo-attach-event="onclick:_onClick" toggled="{%= !!$.checked %}">',
                '<span class="thumb"></span>',
                '<span class="toggleOn">{%= $.onText %}</span>',
                '<span class="toggleOff">{%= $.offText %}</span>',
            '</div>'
        ]),
        toggleNode: null,

        //Localization
        onText: 'ON',
        offText: 'OFF',

        _onClick: function(evt) {
            if (this.isDisabled()) return;

            var toggledValue = !this.getValue();

            this.setValue(toggledValue);
        },
        getValue: function() {
            return (domAttr.get(this.toggleNode, 'toggled') === true);
        },
        setValue: function(val, initial) {
            val = typeof val === 'string'
                ? /^(true|t|0)$/i.test(val)
                : !!val;

            if (initial) this.originalValue = val;

            domAttr.set(this.toggleNode, 'toggled', val);

            if (val === false)
                domClass.remove(this.toggleNode, 'toggleStateOn');
            else
                domClass.add(this.toggleNode, 'toggleStateOn');

            this.onChange(val, this);
        },
        clearValue: function(flag) {
            var initial = flag !== true;

            this.setValue(this.checked, initial);
        },
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });
});
