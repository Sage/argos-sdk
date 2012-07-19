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

define('Sage/Platform/Mobile/CustomizationSet', [
    'dojo/_base/declare',
    'dojo/_base/lang'
], function(
    declare,
    lang
) {
    var expand = function(expression) {
        if (typeof expression === 'function')
            return expression.apply(this, Array.prototype.slice.call(arguments, 1));
        else
            return expression;
    };

    return declare('Sage.Platform.Mobile.CustomizationSet', null, {
        _compiled: null,
        _compiledFrom: null,
        _customizations: null,
        constructor: function(props) {
            this._compiled = {};
            this._compiledFrom = {};
            this._customizations = {};

            lang.mixin(this, props);
        },
        apply: function(path, source) {
            var segments = path.split('#'),
                customizationSet = segments[0],
                customizationsPath,
                customizations,
                result = source;

            console.log('searching for customizations for "%s"', path);

            var forSet = this._customizations[customizationSet],
                forPath = this._customizations[path];

            if (forPath || forSet)
            {
                /**
                 * if any customizations are defined for the path, the compiled result is stored
                 * for the path, and not the set.
                 */
                customizationsPath = forPath ? path : customizationSet;

                console.log('looking for compiled customizations for "%s"', customizationsPath);

                if (source === this._compiledFrom[customizationsPath] && this._compiled[customizationsPath])
                    return this._compiled[customizationsPath]; /* same source layout, no changes */

                customizations = forPath || [];

                if (forSet && forSet !== forPath) customizations = customizations.concat(forSet);

                console.log('compiling customizations for "%s"', customizationsPath);

                if (customizations.length > 0)
                {
                    result = this.compile(customizations, source, null);
                }
            }

            this._compiled[customizationsPath] = result;
            this._compiledFrom[customizationsPath] = source;

            return result;
        },
        toPath: function(customizationSet, customizationSubSet, id) {
            var qualifiedSet = customizationSubSet
                    ? customizationSet + '/' + customizationSubSet
                    : customizationSet,
                path = id
                    ? qualifiedSet + '#' + id
                    : qualifiedSet;

            return path;
        },
        register: function(path, spec) {
            var container = this._customizations[path] || (this._customizations[path] = []);
            if (container) container.push(spec);
        },
        get: function(path, specific) {
            var segments = path.split('#'),
                customizationSet = segments[0];

            var forSet = this._customizations[customizationSet] || [],
                forPath = this._customizations[path] || [];

            if (forPath === forSet || specific) return forPath;

            return forPath.concat(forSet);
        },
        compile: function(customizations, layout, parent) {
            var customizationCount = customizations.length,
                layoutCount = layout.length,
                applied = {},
                output,
                insertRowsBefore,
                insertRowsAfter,
                customization,
                stop,
                row;

            if (lang.isArray(layout))
            {
                output = [];

                for (var i = 0; i < layoutCount; i++)
                {
                    row = layout[i];

                    /*** for compatibility ***/
                    /* will modify the underlying row */
                    if (typeof row['name'] === 'undefined' && typeof row['property'] === 'string')
                        row['name'] = row['property'];
                    /*************************/

                    insertRowsBefore = [];
                    insertRowsAfter = [];

                    for (var j = 0; j < customizationCount; j++)
                    {
                        if (applied[j]) continue; // todo: allow a customization to be applied to a layout more than once?

                        customization = customizations[j];
                        stop = false;

                        if (expand(customization.at, row, parent, i, layoutCount, customization))
                        {
                            switch (customization.type)
                            {
                                case 'remove':
                                    // full stop
                                    stop = true;
                                    row = null;
                                    break;
                                case 'replace':
                                    // full stop
                                    stop = true;
                                    row = expand(customization.value, row);
                                    break;
                                case 'modify':
                                    // make a shallow copy if we haven't already
                                    if (row === layout[i])
                                        row = lang.mixin({}, row);

                                    row = lang.mixin(row, expand(customization.value, row));
                                    break;
                                case 'insert':
                                    (customization.where !== 'before'
                                        ? insertRowsAfter
                                        : insertRowsBefore
                                    ).push(expand(customization.value, row));
                                    break;
                            }

                            applied[j] = true;
                        }

                        if (stop) break;
                    }

                    output.push.apply(output, insertRowsBefore);

                    if (row)
                    {
                        var children = (row['children'] && 'children') || (row['components'] && 'components') || (row['layout'] && 'layout');
                        if (children)
                        {
                            // make a shallow copy if we haven't already
                            if (row === layout[i])
                                row = lang.mixin({}, row);

                            row[children] = this.compile(customizations, row[children], row);
                        }

                        output.push(row);
                    }
                    output.push.apply(output, insertRowsAfter);
                }

                /**
                 * for any non-applied, insert only, customizations, if they have an `or` property that expands into a true expression
                 * the value is applied at the end of the parent group that the `or` property (ideally) matches.
                 */
                for (var k = 0; k < customizationCount; k++)
                {
                    if (applied[k]) continue;

                    customization = customizations[k];

                    if (customization.type == 'insert' && (expand(customization.or, parent, customization) || (customization.at === true)))
                    {
                        output.push(expand(customization.value, null));
                    }
                }
            }
            else if (lang.isFunction(layout))
            {
                return this.compile(customizations, layout.call(this), name);
            }
            else if (lang.isObject(layout))
            {
                output = {};

                for (var name in layout)
                    if (lang.isArray(layout[name]))
                        output[name] = this.compile(customizations, layout[name], name);
                    else
                        output[name] = layout[name];
            }

            return output;
        }
    });
});