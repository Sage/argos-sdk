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
 * Defines a simple toolbar to place buttons within.
 *
 * Includes various default styling for toolbar items with 'place' set to:
 *
 * * `left`: floats element left
 * * `right`: floats element right
 * * `full`: fills element to 100%
 *
 * ActionBar also works from within a scroll container.
 *
 * When using the ActionBar component within a view make sure to set the `props: {managed: true}` to
 * signify the view will be managing the toolbar. Also, the `name: 'value'` of the component will be
 * the key used in `createToolLayout` to access the ActionBar.
 *
 * Example:
 *
 *     {name: 'action', attachPoint: 'toolbars.action', type: ActionBar, props: {managed: true}}
 *
 *     createToolLayout: function() {
 *         return this.tools || (this.tools = {
 *             action: [{
 *                 name: 'login',
 *                 baseClass: 'button action-button',
 *                 label: this.logOnText,
 *                 action: 'authenticate',
 *                 place: 'full',
 *                 scope: this
 *             }]
 *         });
 *     },
 *
 * @alternateClassName ActionBar
 * @extends Toolbar
 */
define('argos/ActionBar', [
    'dojo/_base/declare',
    'dojo/dom-attr',
    'dojo/dom-class',
    'dojo/string',
    './Toolbar'
], function(
    declare,
    domAttr,
    domClass,
    string,
    Toolbar
) {

    return declare('argos.ActionBar', [Toolbar], {
        /**
         * @property {String}
         * The base CSS classes added to the main dom node.
         */
        baseClass: 'toolbar action-toolbar',
        /**
         * @cfg {String}
         * Used to determine toolbar styling, settable via `this.set('position', 'value')` and fires
         * {@link Toolbar#onPositionChange onPositionChange}.
         */
        position: 'action',
        /**
         * Extends the {@link Toolbar#_create parent implementation} to default an items `place` attribute
         * to `'right'` if not defined.
         * @param {Object} props Properties collection of the toolbar item being created.
         * @return {Object} New toolbar item instance
         */
        _create: function(props) {
            props.place = props.place || 'right';

            return this.inherited(arguments, [props]);
        },
        /**
         * Extends the {@link Toolbar#_place parent implementation} to add a CSS class based on the `place` attribute
         * @param {Object} item Toolbar item being placed.
         */
        _place: function(item) {
            domClass.add(item.domNode, 'on-' + item.get('place'));

            this.inherited(arguments);
        },
        /**
         * Override to be able to return the proper parent context in the case of ActionBar being within
         * a scroll container or view.
         * @return Context
         */
        _getContextAttr: function() {
            if (this.context) return this.context;
            return this.getComponentRoot();
        }
    });
});
