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

/**
 * @deprecated Not used.
 * @alternateClassName PersistentStorage
 */
define('Sage/Platform/Mobile/PersistentStorage', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/json',
    'Sage/Platform/Mobile/Convert',
    'Sage/Platform/Mobile/Utility'
], function(
    declare,
    lang,
    json,
    convert,
    utility
) {
    var sosCache = {};

    return declare('Sage.Platform.Mobile.PersistentStorage', null, {

        name: false,
        singleObjectStore: false,
        allowCacheUse: true,
        serializeValues: true,

        constructor: function(options){
            lang.mixin(this, options);
        },
        formatQualifiedKey: function(name, key) {
            if (key && key.indexOf(name) !== 0)
                return name + '.' + key;
            return key;
        },
        serializeValue: function(value) {
            return typeof value === 'object'
                ? json.toJson(value)
                : value && value.toString
                    ? value.toString()
                    : value;
        },
        deserializeValue: function(value) {
            if (value && value.indexOf('{') === 0 && value.lastIndexOf('}') === (value.length - 1))
                return json.fromJson(value);
            if (value && value.indexOf('[') === 0 && value.lastIndexOf(']') === (value.length - 1))
                return json.fromJson(value);
            if (convert.isDateString(value))
                return convert.toDateFromString(value);
            if (/^(true|false)$/.test(value))
                return value === 'true';
            var numeric = parseFloat(value);
            if (!isNaN(numeric))
                return numeric;

            return value;
        },
        getItem: function(key, options) {
            options = options || {};
            try
            {
                if (window.localStorage)
                {
                    if (this.singleObjectStore)
                    {
                        var encoded,
                            store;

                        if (this.allowCacheUse && sosCache[this.name])
                        {
                            store = sosCache[this.name];
                        }
                        else
                        {
                            encoded = window.localStorage.getItem(this.name);
                            store = json.fromJson(encoded);

                            if (this.allowCacheUse) sosCache[this.name] = store;
                        }

                        var value = utility.getValue(store, key);

                        if (options.success)
                            options.success.call(options.scope || this, value);

                        return value;
                    }
                    else
                    {
                        var fqKey = this.formatQualifiedKey(this.name, key),
                            serialized = window.localStorage.getItem(fqKey),
                            value = this.serializeValues && options.serialize !== false
                                ? this.deserializeValue(serialized)
                                : serialized;

                        if (options.success)
                            options.success.call(options.scope || this, value);

                        return value;
                    }
                }
                else
                {
                    if (options.failure)
                        options.failure.call(options.scope || this, false);
                }
            }
            catch (e)
            {
                if (options && options.failure)
                    options.failure.call(options.scope || this, e);
            }
        },
        setItem: function(key, value, options) {
            options = options || {};
            try
            {
                if (window.localStorage)
                {
                    if (this.singleObjectStore)
                    {
                        var encoded,
                            store;

                        if (this.allowCacheUse && sosCache[this.name])
                        {
                            store = sosCache[this.name];
                        }
                        else
                        {
                            encoded = window.localStorage.getItem(this.name);
                            store = (encoded && json.fromJson(encoded)) || {};

                            if (this.allowCacheUse) sosCache[this.name] = store;
                        }

                        utility.setValue(store, key, value);

                        encoded = json.toJson(store);

                        window.localStorage.setItem(this.name, encoded);

                        if (options.success)
                            options.success.call(options.scope || this);

                        return true;
                    }
                    else
                    {
                        var fqKey = this.formatQualifiedKey(this.name, key),
                            serialized = this.serializeValues && options.serialize !== false
                                ? this.serializeValue(value)
                                : value;

                        window.localStorage.setItem(fqKey, serialized);

                        if (options.success)
                            options.success.call(options.scope || this);

                        return true;
                    }
                }
                else
                {
                    if (options.failure)
                        options.failure.call(options.scope || this, false);

                    return false;
                }
            }
            catch (e)
            {
                if (options && options.failure)
                    options.failure.call(options.scope || this, e);

                return false;
            }
        },
        clearItem: function(key, options) {
        }
    });
});