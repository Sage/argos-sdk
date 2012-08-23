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

define('Sage/Platform/Mobile/Utility', [
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/json'
], function(
    lang,
    array,
    json
) {
    var nameToPathCache = {};
    var nameToPath = function(name) {
            if (typeof name !== 'string' || name === '.' || name === '') return []; // '', for compatibility
            if (nameToPathCache[name]) return nameToPathCache[name];
            var parts = name.split('.');
            var path = [];
            for (var i = 0; i < parts.length; i++)
            {
                var match = parts[i].match(/([a-zA-Z0-9_$]+)\[([^\]]+)\]/);
                if (match)
                {
                    path.push(match[1]);
                    if (/^\d+$/.test(match[2]))
                        path.push(parseInt(match[2], 10));
                    else
                        path.push(match[2]);
                }
                else
                {
                    path.push(parts[i]);
                }
            }
            return (nameToPathCache[name] = path.reverse());
        },
        getValue = function(o, name, defaultValue) {
            var path = nameToPath(name).slice(0);
            var current = o;
            while (current && path.length > 0)
            {
                var key = path.pop();
                if (typeof current[key] !== 'undefined')
                    current = current[key];
                else
                    return typeof defaultValue !== 'undefined' ? defaultValue : null;
            }
            return current;
        },
        setValue = function(o, name, val) {
            var current = o;
            var path = nameToPath(name).slice(0);
            while ((typeof current !== "undefined") && path.length > 1)
            {
                var key = path.pop();
                if (path.length > 0)
                {
                    var next = path[path.length - 1];
                    current = current[key] = (typeof current[key] !== "undefined")
                        ? current[key]
                        : (typeof next === "number")
                            ? []
                            : {};
                }
            }
            if (typeof path[0] !== "undefined")
                current[path[0]] = val;
            return o;
        },
        contains = function(rootNode, testNode) {
            return rootNode.contains
                ? rootNode != testNode && rootNode.contains(testNode)
                : !!(rootNode.compareDocumentPosition(testNode) & 16);
        },
        bindDelegate = function(scope) {
            var fn = this;

            if (arguments.length == 1) return function() {
                return fn.apply(scope || this, arguments);
            };

            var optional = Array.prototype.slice.call(arguments, 1);
            return function() {
                var called = Array.prototype.slice.call(arguments, 0);
                return fn.apply(scope || this, called.concat(optional));
            };
        },
        expand = function(scope, expression) {
            if (typeof expression === 'function')
            {
                return expression.apply(scope, Array.prototype.slice.call(arguments, 2));
            }
            else
            {
                return expression;
            }
        },
        _clone = function(item) {
            if (lang.isArray(item))
            {
                return item.slice(0);
            }
            else if (lang.isObject(item))
            {
                var clone = {};
                for (var prop in item) clone[prop] = item[prop];
                return clone;
            }

            return item;
        },
        expandSafe = function(scope, expression) {
            var result = typeof expression === 'function'
                ? expression.apply(scope, Array.prototype.slice.call(arguments, 2))
                : expression;

            if (result === expression)
            {
                if (lang.isArray(result))
                {
                    return result.map ? result.map(_clone) : array.map(result, _clone);
                }
                else
                {
                    return _clone(result);
                }
            }

            return result;
        },
        /**
         * Sanitizes an Object so that JSON.stringify will work without errors by discarding non-stringable keys
         * @param obj Object that can be JSON.stringified
         */
        sanitizeForJson = function(obj) {
            var type;
            for (var key in obj)
            {
                try
                {
                    type = typeof obj[key];
                }
                catch(e)
                {
                    delete obj[key];
                    continue;
                }

                switch(type)
                {
                    case 'undefined':
                        obj[key] = 'undefined';
                        break;

                    case 'function':
                        delete obj[key];
                        break;

                    case 'object':
                        if (obj[key] === null) {
                            obj[key] = 'null';
                            break;
                        }
                        if(key === 'scope')
                        {
                            obj[key] = 'null';
                            break;
                        }
                        obj[key] = this.sanitizeForJson(obj[key]);
                        break;
                    case 'string':
                        try
                        {
                            obj[key] = json.fromJson(obj[key]);
                            obj[key] = this.sanitizeForJson(obj[key]);
                        }
                        catch(e){}
                        break;
                }
            }
            return obj;
        };


    return lang.setObject('Sage.Platform.Mobile.Utility', {
        getValue: getValue,
        setValue: setValue,
        contains: contains,
        bindDelegate: bindDelegate,
        expand: expand,
        expandSafe: expandSafe,
        sanitizeForJson: sanitizeForJson
    });
});