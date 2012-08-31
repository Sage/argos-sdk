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

define('Sage/Platform/Mobile/Fields/SignatureField', [
    'dojo/_base/declare',
    'dojo/_base/json',
    'dojo/dom-attr',
    'Sage/Platform/Mobile/Format',
    'Sage/Platform/Mobile/Fields/EditorField',
    'Sage/Platform/Mobile/FieldManager'
], function(
    declare,
    json,
    domAttr,
    format,
    EditorField,
    FieldManager
) {

    /**
     * The SignatureField uses an HTML5 canvas element to render previews of the signature vector
     * provided by it's editor view {@link SignatureView SignatureView}.
     *
     * ###Example:
     *     {
     *         name: 'Signature',
     *         property: 'Signature',
     *         label: this.signatureText,
     *         type: 'signature'
     *     }
     *
     * @alternateClassName SignatureField
     * @extends EditorField
     * @requires FieldManager
     * @requires SignatureView
     * @requires format
     */
    var control = declare('Sage.Platform.Mobile.Fields.SignatureField', [EditorField], {
        // Localization
        /**
         * @property {String}
         * Text used for ARIA label
         */
        signatureLabelText: 'signature',
        /**
         * @property {String}
         * Text used within button
         */
        signatureText: '...',

        /**
         * @property {Number[][]}
         * A series of x,y coordinates in the format of: `[[0,0],[1,5]]`
         */
        signature: [],
        /**
         * @cfg {Object}
         * If overriding this value make sure to set all the values:
         *
         * key          default         description
         * ---------   ---------        ---------------------------------
         * scale       1                Ratio in which the vector to canvas should be drawn
         * lineWidth   1                Stroke thickness of the line
         * penColor    'blue'           Color of line. Accepts HTML safe string names or hex.
         * width       180              Width of signature preview in field
         * height      50               Height of signature preview in field
         */
        config: {
            scale: 1,
            lineWidth: 1,
            penColor: 'blue',
            width: 180,
            height: 50
        },
        /**
         * @property {Simplate}
         * Simplate that defines the fields HTML Markup
         *
         * * `$` => Field instance
         * * `$$` => Owner View instance
         *
         */
        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.signatureLabelText %}"><span aria-hidden="true">{%: $.signatureText %}</span></button>',
            '<img data-dojo-attach-point="signatureNode" src="" width="{%: $.config.width %}" height="{%: $.config.height %}" alt="" />',
            '<input data-dojo-attach-point="inputNode" type="hidden">'
        ]),

        /**
         * Extends the {@link EditorField#createNavigationOptions parent} implementation by
         * also passing the `signature` array.
         * @return {Object} Navigation options
         */
        createNavigationOptions: function() {
            var options = this.inherited(arguments);

            options.signature = this.signature;

            return options;
        },
        /**
         * Complete override that gets the editor view, gets the values and calls set value on the field
         */
        getValuesFromView: function() {
            var view = App.getPrimaryActiveView();
            if (view)
            {
                var value = view.getValues();
                this.currentValue = this.validationValue = value;
                this.setValue(this.currentValue, false);
            }
        },
        /**
         * Sets the signature value by using {@link format#imageFromVector format.imageFromVector}
         * to the img node and setting the array directly to `originalValue`.
         * @param val
         * @param initial
         */
        setValue: function (val, initial) {
            if (initial) this.originalValue = val;

            domAttr.set(this.inputNode, 'value', val || '');

            try
            {
                this.signature = json.fromJson(val);
            }
            catch(e)
            {
                this.signature = [];
            }

            if (!this.signature || Array != this.signature.constructor)
                this.signature = [];

            this.signatureNode.src = format.imageFromVector(this.signature, this.config, false);
        },
        /**
         * Clears the value set to the hidden field
         */
        clearValue: function() {
            this.setValue('', true);
        },
        /**
         * Since the EditorField calls `formatValue` during {@link EditorField#complete complete}
         * we need to override to simply return the value given.
         * @param val
         * @return {Array/String}
         */
        formatValue: function(val) {
            return val;
        }
    });

    return FieldManager.register('signature', control);
});
