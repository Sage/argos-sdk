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

(function() {
    Sage.Platform.Mobile.Controls.Field = Ext.extend(Ext.util.Observable, {
        attachmentPoints: {},
        owner: false,
        applyTo: false,
        alwaysUseValue: false,
        disabled: false,
        hidden: false,
        constructor: function(o) {
            Ext.apply(this, o);

            this.addEvents(
                'change',
                'show',
                'hide',
                'enable',
                'disable'
            );

            Sage.Platform.Mobile.Controls.Field.superclass.constructor.apply(this, arguments);
        },       
        renderTo: function(el) {
            this.containerEl = el; // todo: should el actually be containerEl instead of last rendered node?
            this.el = Ext.DomHelper.append(
                el,
                this.template.apply(this),
                true
            );

            for (var n in this.attachmentPoints)
                if (this.attachmentPoints.hasOwnProperty(n))
                    this[n] = el.child(String.format(this.attachmentPoints[n], this.name));
        },
        init: function() {
        },
        isDirty: function() {
            return true;
        },
        enable: function() {
            this.disabled = false;
            this.fireEvent('enable', this);
        },
        disable: function() {
            this.disabled = true;
            this.fireEvent('disable', this);
        },
        isDisabled: function() {
            return this.disabled;
        },
        show: function() {
            this.hidden = false;
            this.fireEvent('show', this);
        },
        hide: function() {
            this.hidden = true;
            this.fireEvent('hide', this);
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

            var all = Ext.isArray(this.validator) ? this.validator : [this.validator],
                current,
                definition;

            for (var i = 0; i < all.length; i++)
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

                var value = typeof value === 'undefined'
                    ? this.getValue()
                    : value;

                var result = typeof definition.fn === 'function'
                    ? definition.fn.call(definition.scope || this, value, this, this.owner)
                    : definition.test instanceof RegExp
                        ? !definition.test.test(value)
                        : false;

                if (result)
                {
                    if (definition.message)
                        result = typeof definition.message === 'function'
                            ? definition.message.call(definition.scope || this, value, this, this.owner)
                            : String.format(definition.message, value, this.name, this.label);

                    return result;
                }
            }

            return false;
        }
    });
})();