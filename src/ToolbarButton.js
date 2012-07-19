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

define('Sage/Platform/Mobile/ToolbarButton', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/dom-class',
    'dojo/dom-attr',
    './Control'
], function(
    declare,
    lang,
    domClass,
    domAttr,
    Control
) {
    return declare('Sage.Platform.Mobile.ToolbarButton', [Control], {
        tag: 'button',
        attrs: {
            'data-action': 'invoke'
        },
        baseClass: 'button tool-button',
        components: [
            {content: Simplate.make([
                '<div>',
                '{% if ($.icon) { %}',
                '<img src="{%= $.icon %}" alt="{%= $.name %}" />',
                '{% } %}',
                '{% if ($.label) { %}',
                '<span>{%: $.label %}</span>',
                '{% } %}',
                '</div>'
            ])}
        ],
        enabled: true,
        visible: true,
        place: null,
        icon: null,
        name: null,
        label: null,

        _setNameAttr: function(value) {
            this.name = value;

            domAttr.set(this.domNode, 'data-command', value);

            if (!this.get('label')) this.set('label', value);
        },
        _getNameAttr: function() {
            return this.name;
        },
        _setLabelAttr: function(value) {
            this.label = value;

            domAttr.set(this.domNode, 'aria-label', value);
        },
        _getLabelAttr: function() {
            return this.label;
        },
        _setEnabledAttr: function(value) {
            this.enabled = value;

            domClass.toggle(this.domNode, 'is-disabled', !value);
        },
        _getEnabledAttr: function() {
            return this.enabled;
        },
        _setVisibleAttr: function(value) {
            this.visible = value;

            domClass.toggle(this.domNode, 'is-hidden', !value);
        },
        _getVisibleAttr: function() {
            return this.visible;
        },
        update: function(context) {}
    });
});