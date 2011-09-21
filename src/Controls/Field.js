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

define('Sage/Platform/Mobile/Controls/Field', ['dojo', 'dojo/string'], function() {
    dojo.declare('Sage.Platform.Mobile.Controls.FieldManager', null, {});
    Sage.Platform.Mobile.Controls.FieldManager = (function() {
        var types = {};
        return {
            types: types,
            register: function(name, ctor) {
                types[name] = ctor;
            },
            get: function(name) {
                return types[name];
            }
        };
    })();

    dojo.declare('Sage.Platform.Mobile.Controls.Field', null, {
        attributeMap: {},
        owner: false,
        applyTo: false,
        alwaysUseValue: false,
        disabled: false,
        hidden: false,
        template: new Simplate([
            '<input dojoAttachPoint="inputNode">'
        ]),
        constructor: function(o) {
            dojo.mixin(this, o);
            this.inherited(arguments);
        },       
        renderTo: function(node) {
            this.containerNode = node; // todo: should el actually be containerEl instead of last rendered node?
            dojo.place(
                this.template.apply(this),
                node
            );
        },
        init: function() {
        },
        isDirty: function() {
            return true;
        },
        enable: function() {
            this.disabled = false;
        },
        disable: function() {
            this.disabled = true;
        },
        isDisabled: function() {
            return this.disabled;
        },
        show: function() {
            this.hidden = false;
        },
        hide: function() {
            this.hidden = true;
        },
        change: function(){
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

            var all = dojo.isArray(this.validator) ? this.validator : [this.validator],
                allLength = all.length,
                current,
                definition;

            for (var i = 0; i < allLength; i++)
            {
                current = all[i];

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
        }
    });
});