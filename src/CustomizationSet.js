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
 * CustomizationSet is customization registry and engine rolled into one.
 *
 * There is a shortcut available when requiring CustomizationSet:
 *
 *     define('myClass', ['argos!customizations'], function(customizations) {
 *         var myFunc = function() {
 *             var customizationSet = customizations();
 *             var customizedLayout = customizationSet.apply(customizationSet.toPath('root', 'sub', 'id', {original}));
 *         }
 *     });
 *
 * Basically CustomizationSet provides an interface to overriding only parts of a classes layout (or any piece of a class
 * that is done in the layout manner: hashtags, tools, list-actions, etc).
 *
 * See {@link App#registerCustomization App.registerCustomization} for the current shortcut for registering a customization.
 *
 * The purpose of customizations is to provide third-parties the ability to change a base application without modifying
 * the SDK or base app code. The customizations are side-loaded during application startup/load and are then applied
 * when the view is shown/refreshed. This allows seamless upgrades/patches to the SDK/base app without destroying any
 * alterations made.
 *
 * @alternateClassName CustomizationSet
 */
define('argos/CustomizationSet', [
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

    return declare('argos.CustomizationSet', null, {
        _compiled: null,
        _compiledFrom: null,
        _customizations: null,
        constructor: function(props) {
            this._compiled = {};
            this._compiledFrom = {};
            this._customizations = {};

            lang.mixin(this, props);
        },
        /**
         * Takes a path id to the customization set and the original source layout and returns the customizations applied
         * to the original.
         * @param {String} path Use {@link #toPath toPath} to create a proper path string
         * @param {Object} source
         * @return {Object}
         */
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
        /**
         * Constructs a customization path string but taking the set, subsit and id and joining them with the
         * needed symbols.
         * @param {String} customizationSet The root or set, typically 'list', 'detail' or 'edit'
         * @param {String?} customizationSubSet Used for targetting subsets like 'tools', 'actions' or 'hashTagQueries'
         * @param {String} id Id of the view to customize
         * @return {String}
         */
        toPath: function(customizationSet, customizationSubSet, id) {
            var qualifiedSet = customizationSubSet
                    ? customizationSet + '/' + customizationSubSet
                    : customizationSet,
                path = id
                    ? qualifiedSet + '#' + id
                    : qualifiedSet;

            return path;
        },
        /**
         * Adds the customization specification/definition to the given path. When a matching {@link #apply apply} is
         * called this customization will be merged on top of the source/original object passed in apply.
         * @param {String} path
         * @param {Object} spec
         */
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
                applied = {};

            if (lang.isArray(layout))
            {
                var output = [],
                    layoutCount = layout.length;

                for (var i = 0; i < layoutCount; i++)
                {
                    var row = layout[i];

                    /*** for compatibility ***/
                    /* will modify the underlying row */
                    if (typeof row['name'] === 'undefined' && typeof row['property'] === 'string')
                        row['name'] = row['property'];
                    /*************************/

                    var insertRowsBefore = [];
                    var insertRowsAfter = [];

                    for (var j = 0; j < customizationCount; j++)
                    {
                        if (applied[j]) continue; // todo: allow a customization to be applied to a layout more than once?

                        var customization = customizations[j],
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

                return output;
            }
            else if (lang.isFunction(layout))
            {
                return this.compile(customizations, layout.call(this), name);
            }
            else if (lang.isObject(layout))
            {
                /*
                    Transforms:
                    {top: [{}, {}], bottom: [{}]}

                    to:

                    [
                     {name: top, children: [{}, {}]},
                     {name: bottom, children: [{}]}
                    ]

                    To allow customizations to register at the "root" level.
                    In the above example it allows at: function(o) { return o.name == 'top'; }
                 */

                var objectLayout = [],
                    output = {};

                for (var name in layout)
                {
                    if (lang.isArray(layout[name]))
                    {
                        objectLayout.push({
                            name: name,
                            children: layout[name]
                        });
                    }
                }
                var compiled = this.compile(customizations, objectLayout, 'root');

                for (var i = 0; i < compiled.length; i++)
                {
                    var subObject = compiled[i];
                    output[subObject.name] = subObject.children;
                }

                return output;
            }
        }
    });
});