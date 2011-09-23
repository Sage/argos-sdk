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

define('Sage/Platform/Mobile/_CustomizationMixin', ['dojo'], function() {

    var expand = function(expression) {
        if (typeof expression === 'function')
            return expression.apply(this, Array.prototype.slice.call(arguments, 1));
        else
            return expression;
    };

    dojo.declare('Sage.Platform.Mobile._CustomizationMixin', null, {
        _layoutCompiled: null,
        _layoutCompiledFrom: null,
        id: null,
        customizationSet: null,
        enableCustomizations: true,
        constructor: function() {
            this._layoutCompiled = {};
            this._layoutCompiledFrom = {};
        },
        _getCustomizationsFor: function(customizationSubSet) {
            var customizationSet = customizationSubSet
                ? this.customizationSet + '/' + customizationSubSet
                : this.customizationSet;
            return App.getCustomizationsFor(customizationSet, this.id);
        },
        _createCustomizedLayout: function(layout, customizationSubSet) {
            var customizationSet = customizationSubSet
                    ? this.customizationSet + '/' + customizationSubSet
                    : this.customizationSet,
                key = customizationSet, // was `customizationSet;id` but since the store is per instance, `id` is not needed
                source = layout;
            if (source === this._layoutCompiledFrom[key] && this._layoutCompiled[key])
                return this._layoutCompiled[key]; // same source layout, no changes

            if (this.enableCustomizations)
            {
                var customizations = this._getCustomizationsFor(customizationSubSet);
                if (customizations && customizations.length > 0)
                {
                    layout = this._compileCustomizedLayout(customizations, source, null);
                }
            }

            this._layoutCompiled[key] = layout;
            this._layoutCompiledFrom[key] = source;

            return layout;
        },
        _compileCustomizedLayout: function(customizations, layout, parent) {
            var customizationCount = customizations.length,
                layoutCount = layout.length,
                applied = {},
                output,
                insertRowsBefore,
                insertRowsAfter,
                customization,
                stop,
                row;

            if (dojo.isArray(layout))
            {
                output = [];
                
                for (var i = 0; i < layoutCount; i++)
                {
                    row = layout[i];
                    insertRowsBefore = [];
                    insertRowsAfter = [];

                    for (var j = 0; j < customizationCount; j++)
                    {
                        customization = customizations[j];
                        stop = false;

                        if (customization.at(row, parent, i, layoutCount, customization))
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
                                        row = Ext.apply({}, row);
                                    row = dojo.mixin(row, expand(customization.value, row));
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
                        if (row['as'])
                        {
                            // make a shallow copy if we haven't already
                            if (row === layout[i])
                                row = dojo.mixin({}, row);

                            row['as'] = this._compileCustomizedLayout(customizations, row['as'], row);
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

                    if (customization.type == 'insert' && expand(customization.or, parent, customization))
                    {
                        output.push(expand(customization.value, null));
                    }
                }
            }
            else if (dojo.isObject(layout))
            {
                output = {};

                for (var name in layout)
                    if (dojo.isArray(layout[name]))
                        output[name] = this._compileCustomizedLayout(customizations, layout[name], name);
                    else
                        output[name] = layout[name];
            }

            return output;
        }
    });

});
