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
 * A special extension of a Pane that is:
 *
 *  1. Not tracked in history/navigation
 *  2. Is shown "on top" of the app at a smaller width
 *  3. Has a masked translucent background
 *
 *  Like, Pane it is a container for Views and can hold anything that is passed into it. A typical
 *  example would be:
 *
 *      scene().showView('login', null, 'dialog');
 *
 *  Where `dialog` is the name of an instance of DialogPane as defined in the apps Layout.
 *
 * @alternateClassName DialogPane
 * @extends Pane
 * @requires TitleBar
 */
define('argos/DialogPane', [
    'dojo/_base/declare',
    'dojo/dom-class',
    './Pane',
    './TitleBar'
], function(
    declare,
    domClass,
    Pane,
    TitleBar
) {
    return declare('argos.DialogPane', [Pane], {
        /**
         * @property {_Component[]}
         * Array of child {@link _Component components}, notably there is the iframe which is placed
         * behind the content to intercept clicks (to mimic a modal dialog).
         */
        components: [
            {name: 'dialog-content', tag: 'div', attrs: {'class': 'dialog-content'}, attachPoint: 'dialogContentNode', components: [
                {name: 'top', type: TitleBar, attachEvent: 'onPositionChange:_onToolbarPositionChange', props: {managed: true, visible: false}},
                {name: 'container', tag: 'div', attrs: {'class': 'view-container'}, attachPoint: 'viewContainerNode'}
            ]},
            {name: 'frame', tag: 'iframe'}
        ],

        /**
         * @property {HTMLElement}
         * The dialog content node that houses the toolbar and view container
         */
        dialogContentNode: null,


        /**
         * @property {String}
         * CSS classes added to the outmost dom node of the pane. `dialog` is required for the normal
         * layout positioning.
         */
        baseClass: 'dialog is-hidden',

        /**
         * @property {Boolean}
         * Required to be false. This prevents the pane from being tracked in history/navigation
         */
        tier: false,


        /**
         * Overrides the FixedSplitterPane to remove the CSS class `mblFixedSplitterPane` this keeps
         * the parent Layout (FixedSplitter) from including this Pane in the width/height calculations
         */
        buildRendering: function(){
            this.inherited(arguments);

            domClass.remove(this.domNode, "mblFixedSplitterPane");
        },

        /**
         * Overrides the parent implementation to add the appropiate toolbar CSS classes to the
         * dialog content node which contains the toolbar/view instead of the outmost div.
         * @param position
         * @param previous
         */
        _onToolbarPositionChange: function(position, previous) {
            if (previous) domClass.remove(this.dialogContentNode, 'has-toolbar-' + previous);

            domClass.add(this.dialogContentNode, 'has-toolbar-' + position);
        },

        /**
         * Extends the parent implementation to call {@link #showDialog showDialog()} which handles the
         * visibility change.
         * @return {Object} Deferred transition.
         */
        show: function() {
            if (!this.active)
                this.showDialog();

            return this.inherited(arguments);
        },

        /**
         * Makes the DialogPane visible and sets the appropiate flag.
         */
        showDialog: function() {
            domClass.remove(this.domNode, 'is-hidden');
        },

        /**
         * Makes the DialogPane hidden and sets the appropiate flag.
         */
        hideDialog: function() {
            this.active = null;
            domClass.add(this.domNode, 'is-hidden');
        },

        /**
         * Listens to when the Layout is changing any Pane. If the DialogPane is active and
         * the target pane is not this instance then this DialogPane should auto-close.
         * @param {Object} o Contains `tier` which is the numbered tier or false and `pane` which is the
         * target pane instance a view is being put into.
         */
        onPaneChange: function(o) {
            if (this.active && o.pane !== this)
                this.hideDialog();

            this.inherited(arguments);
        }
    });
});