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
 * The SelectField is a minor extension to te LookupField in that it explicitly hides search and actions.
 *
 * It may also optionally pass the `data` option which a view may optionally use instead of requesting data.
 *
 * ###Example:
 *     {
 *         name: 'State',
 *         property: 'State',
 *         label: this.stateText,
 *         type: 'select',
 *         view: 'state_list'
 *     }
 *
 * @alternateClassName SelectField
 * @extends LookupField
 */define('argos/Fields/SelectField', [
    'dojo/_base/declare',
    './LookupField'
], function(
    declare,
    LookupField
) {
    return declare('argos.Fields.SelectField', [LookupField], {
        /**
         * @cfg {Boolean}
         * Overrides the {@link LookupField LookupField} default to explicitly set it to false forcing
         * the view to use the currentValue instead of a key/descriptor
         */
        valueKeyProperty: false,

        /**
         * @cfg {Boolean}
         * Overrides the {@link LookupField LookupField} default to explicitly set it to false forcing
         * the view to use the currentValue instead of a key/descriptor
         */
        valueTextProperty: false,

        /**
         * @cfg {Object/Object[]/Function}
         * Required. If set as a function will be expanded.
         * Passed in the navigation options to the lookup view
         */
        data: null,

        /**
         * Overides the {@link LookupField#createNavigationOptions parent implementation} to set search and actions to
         * hidden and pass `data` defined on the field.
         */
        createNavigationOptions: function() {
            var options = this.inherited(arguments);
            options.hideSearch = true;
            options.data = this.expandExpression(this.data);
            return options;
        }        
    });
});