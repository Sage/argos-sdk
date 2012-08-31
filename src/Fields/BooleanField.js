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
    'Sage/Platform/Mobile/Fields/_Field',
    'Sage/Platform/Mobile/FieldManager'
], function(
    declare,
    domAttr,
    domClass,
    Field,
    FieldManager
) {
    /**
     * The Boolean Field is used for true/false values and is visualized as a toggle or light switch.
     *
     * ###Example:
     *     {
     *         name: 'IsLead',
     *         property: 'IsLead',
     *         label: this.isLeadText,
     *         type: 'boolean'
     *     }
     *
     * @alternateClassName BooleanField
     * @extends _Field
     * @requires FieldManager
     */
    var control = declare('Sage.Platform.Mobile.Fields.BooleanField', [Field], {
        /**
         * @property {Object}
         * Provides a setter to the toggleNodes toggled attribute
         */
        attributeMap: {
            toggled:{
                node: 'toggleNode',
                type: 'attribute',
                attribute: 'toggled'
            }
        },
        /**
         * @property {Simplate}
         * Simplate that defines the fields HTML Markup
         *
         * * `$` => Field instance
         * * `$$` => Owner View instance
         *
         */
        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<div class="toggle" data-dojo-attach-point="toggleNode" data-dojo-attach-event="onclick:_onClick" toggled="{%= !!$.checked %}">',
                '<span class="thumb"></span>',
                '<span class="toggleOn">{%= $.onText %}</span>',
                '<span class="toggleOff">{%= $.offText %}</span>',
            '</div>'
        ]),
        /**
         * @property {HTMLElement}
         * The div node that holds the toggled attribute
         */
        toggleNode: null,

        /**
         * @property {Boolean}
         * When clearing the boolean field it sets the fields value to `this.checked`
         */
        checked: false,

        /**
         * Value used during dirty/modified comparison
         */
        originalValue: null,

        //Localization
        /**
         * @property {String}
         * The text placed within the "on" part of the toggle switch
         */
        onText: 'ON',
        /**
         * @property {String}
         * The text placed within the "off" part of the toggle switch
         */
        offText: 'OFF',

        /**
         * Fires with the toggle switch is pressed and sets the value to
         * the opposite of the current value
         * @param {Event} evt The click/tap event
         */
        _onClick: function(evt) {
            if (this.isDisabled()) return;

            var toggledValue = !this.getValue();

            this.setValue(toggledValue);
        },
        /**
         * Returns the current toggled state
         * @return {Boolean}
         */
        getValue: function() {
            return (domAttr.get(this.toggleNode, 'toggled') === true);
        },
        /**
         * Sets the toggled attribute of the field and applies the needed styling.
         *
         * It also directly fires the {@link _Field#onChange onChange} event.
         *
         * @param {Boolean/String/Number} val If string is passed it will use `'true'` or `'t'` for true. If number then 0 for true.
         * @param {Boolean} initial If true sets the value as the original value and is later used for dirty/modified detection.
         */
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
        /**
         * Sets the value back to `this.checked` as the initial value. If true is passed it sets
         * `this.checked` as a dirty/modified value.
         * @param {Boolean} flag Signifies if the cleared value should be set as modified (true) or initial (false/undefined)
         */
        clearValue: function(flag) {
            var initial = flag !== true;

            this.setValue(this.checked, initial);
        },
        /**
         * Determines if the field has been modified from it's original value
         * @return {Boolean}
         */
        isDirty: function() {
            return (this.originalValue != this.getValue());
        }
    });

    return FieldManager.register('boolean', control);
});