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

define('Sage/Platform/Mobile/Fields/_Field', [
    'dojo',
    'dojo/string',
    'dojo/NodeList-manipulate',
    'dojo/NodeList-traverse',
    'dijit/_Widget',
    'Sage/Platform/Mobile/FieldManager',
    'Sage/Platform/Mobile/_ActionMixin',
    'Sage/Platform/Mobile/_Templated'
], function() {
    
    return dojo.declare('Sage.Platform.Mobile.Fields._Field', [dijit._Widget, Sage.Platform.Mobile._ActionMixin, Sage.Platform.Mobile._Templated], {
        owner: false,
        applyTo: false,
        alwaysUseValue: false,
        disabled: false,
        hidden: false,
        widgetTemplate: new Simplate([
            '<input data-dojo-attach-point="inputNode">'
        ]),
        constructor: function(o) {
            dojo.mixin(this, o);
        },
        renderTo: function(node) {
            this.containerNode = node; // todo: should node actually be containerNode instead of last rendered node?
            this.placeAt(node);
        },
        init: function() {
        },
        isDirty: function() {
            return true;
        },
        enable: function() {
            this.disabled = false;
            this.onEnable(this);
        },
        disable: function() {
            this.disabled = true;
            this.onDisable(this);
        },
        isDisabled: function() {
            return this.disabled;
        },
        show: function() {
            this.hidden = false;
            this.onShow(this);
        },
        hide: function() {
            this.hidden = true;
            this.onHide(this);
        },
        isHidden: function() {
            return this.hidden;
        },
        getValue: function() {
        },
        setValue: function(val, initial) {
        },        
        clearValue: function() {
        },
        validate: function(value) {
            if (typeof this.validator === 'undefined')
                return false;

            var all = dojo.isArray(this.validator) ? this.validator : [this.validator];

            for (var i = 0; i < all.length; i++)
            {
                var current = all[i],
                    definition;

                if (current instanceof RegExp)
                    definition = {
                        test: current
                    };
                else if (typeof current === 'function')
                    definition = {
                        fn: current
                    };
                else
                    definition = current;

                value = typeof value === 'undefined'
                    ? this.getValue()
                    : value;

                var result = typeof definition.fn === 'function'
                    ? definition.fn.call(definition.scope || this, value, this, this.owner)
                    : definition.test instanceof RegExp
                        ? !definition.test.test(value)
                        : false;

                if (result) {
                    if (definition.message)
                        result = typeof definition.message === 'function'
                            ? definition.message.call(definition.scope || this, value, this, this.owner)
                            : dojo.string.substitute(definition.message, [value, this.name, this.label]);

                    return result;
                }
            }
            return false;
        },
        onEnable: function(field) {
        },
        onDisable: function(field) {
        },
        onShow: function(field) {
        },
        onHide: function(field) {
        },
        onChange: function(value, field) {
        }
    });
});