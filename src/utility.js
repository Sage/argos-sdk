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
 * Utility provides functions that are more javascript enhancers than application related code.
 * @alternateClassName utility
 * @singleton
 */
define('argos/utility', [
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/json'
], function(
    lang,
    array,
    json
) {
    var nameToPathCache = {};

    return lang.setObject('argos.utility', {
        /**
         * Takes an javascript dot-notated string path and converts it into a reversed array separate parts:
         *
         *     'test.case' => ['case', 'test']
         *     'test[2]' => [2, 'test']
         *     'test.case[2].item.props[4]' => [4, 'props', 'item', 2, 'case', 'test']
         *
         * Also features a small in-memory cache of names to paths for improved performance.
         *
         * @param {String} name Dot-notated string path to split
         * @return {String[]} The name split into each javascript accessible part
         */
        nameToPath: function(name) {
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

        /**
         * Retrieves a value from a given object and a given property "path" of that object. If the
         * property is undefined, optionally return the provided defaultValue or null if no default is
         * provided.
         *
         * Example:
         *
         *     var myObj = { test: { case: 'one' } };
         *     utility.getValue(myObj, 'test.case', 'none');
         *     // returns 'one'
         *
         *     var myObj2 = { test: null };
         *     utility.getValue(myObj2, 'test.case', 'none');
         *     // returns 'none'
         *
         * Similar to {@link #setValue setValue}, this provides the benefit of avoiding the accessing
         * and undefined property error for long path names.
         *
         * @param {Object} o Object in which to retrieve the value from
         * @param {String} name Dot notation string of the property path
         * @param {Mixed} [defaultValue=null] Fallback value if the property is undefined
         * @return {Mixed}
         */
        getValue: function(o, name, defaultValue) {
            var path = this.nameToPath(name).slice(0);
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

        /**
         * Given an object and a "path" to the its property, sets the provided value:
         *
         * Example:
         *
         *     var myObj = { test: { case: 'one' } };
         *     utility.setValue(myObj, 'test.case', 'two');
         *
         * That doesn't seem like much, but consider the case of not having the object made beforehand:
         *
         *     var myObj = {};
         *     utility.setValue(myObj, 'test.case', 'two');
         *
         * You get the same result -- no more "accessing undefined property" errors.
         *
         * @param {Object} o Object in which to look for a property.
         * @param {String} name Dot-notated path name to the property of the passed object.
         * @param {Mixed} val Value to set the property to
         * @return {Object} Returns the object passed in (for chaining).
         */
        setValue: function(o, name, val) {
            var current = o;
            var path = this.nameToPath(name).slice(0);
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

        /**
         * Clones a given object or array and returns it.
         * @private
         * @param {Object/Array} item Object or Array to be cloned
         * @returns {Object/Array}
         */
        _clone: function(item) {
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

        /**
         * Determines if the given testNode is a child (recursive) of the given rootNode.
         * @param {HTMLElement} rootNode Parent, or root, node to search
         * @param {HTMLElement} testNode Node to search for within the rootNode
         * @return {Boolean}
         */
        contains: function(rootNode, testNode) {
            return rootNode.contains
                ? rootNode != testNode && rootNode.contains(testNode)
                : !!(rootNode.compareDocumentPosition(testNode) & 16);
        },

        /**
         * Similar to dojo.hitch, bindDelegate allows you to alter the meaning of `this` and pass
         * additional parameters.
         *
         * This is a complicated subject but a brief overview is:
         *
         *     var foo = {
         *         bar: function() { console.log(this, arguments); }
         *     };
         *
         *     var fizz = {
         *         bang: foo.bar.bindDelegate(foo, 'bang');
         *     };
         *
         *     fizz.bang('shoot');
         *
         *     // console outputs: foo Object, ['shoot', 'bang']
         *
         * The two differences between bindDelegate and dojo.hitch are:
         *
         * 1. bindDelegate "appends" the arguments - which is why `bang` came after `shoot` in the arguments
         *
         * 2. bindDelegate is applied directly to the Function prototype (no need to wrap).
         *
         * BindDelegate is important because it allows context changing between modules, as `this` within
         * a module should refer to the module itself - bindDelegate enables this dynamic shifting.
         *
         * @param {Object} scope The new `this` value in which to call the function, providing a new context.
         * @return {Function} Altered function that when called alter the `this` context and append params.
         */
        bindDelegate: function(scope) {
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

        /**
         * If given expression is a function it is called with the given scope and returned,
         * else the expression is just returned.
         * @param {Object} scope Scope to call the function in (`this` definition)
         * @param {Mixed} expression Value to expand
         * @return {Mixed}
         */
        expand: function(scope, expression) {
            if (typeof expression === 'function')
                return expression.apply(scope, Array.prototype.slice.call(arguments, 2));
            else
                return expression;
        },

        /**
         * Similar to {@link #expand expand} in that if the given expression is a function it is
         * called with the given scope and the result returned, else the expression itself is returned.
         *
         * The key difference is in the non-function cases the returned expression is cloned,
         * providing a copy of the expression instead of a pointer back to the original.
         *
         * @param {Object} scope Scope to call the function in (`this` definition)
         * @param {Function/String/Number/Object} expression Value to expand
         * @return {Function/String/Number/Object}
         */
        expandSafe: function(scope, expression) {
            var result = typeof expression === 'function'
                ? expression.apply(scope, Array.prototype.slice.call(arguments, 2))
                : expression;

            if (result === expression)
            {
                if (lang.isArray(result))
                {
                    return result.map ? result.map(this._clone) : array.map(result, this._clone);
                }
                else
                {
                    return this._clone(result);
                }
            }

            return result;
        },

        /**
         * Sanitizes an Object so that JSON.stringify will work without errors by discarding non-stringable keys.
         * @param {Object} obj Object to be cleansed of non-stringify friendly keys/values.
         * @return {Object} Object ready to be JSON.stringified.
         */
        sanitizeForJson: function(obj) {
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

                            if (typeof obj[key] === 'object')
                                obj[key] = this.sanitizeForJson(obj[key]);
                        }
                        catch(e){}
                        break;
                }
            }
            return obj;
        }
    });
});