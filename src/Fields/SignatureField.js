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

define('Sage/Platform/Mobile/Fields/SignatureField', ['Sage/Platform/Mobile/Fields/EditorField', 'Sage/Platform/Mobile/Views/Signature'], function() {

    var clearCanvas = function (context) {
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }

    var control = dojo.declare('Sage.Platform.Mobile.Fields.SignatureField', [Sage.Platform.Mobile.Fields.EditorField], {
        // Localization
        emptyText: '',
        titleText: 'Signature',
        signatureLabelText: 'signature',
        signatureText: '...',

        signature: [],
        scale: 0.5,
        lineWidth: 1,
        penColor: 'blue',
        context: null,
        canvasNodeName: 'signatureNode',
        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.signatureLabelText %}"><span aria-hidden="true">{%: $.signatureText %}</span></button>',
            '{%= dojo.string.substitute($.canvasTemplate, [$.canvasNodeName]) %}',
            '<input data-dojo-attach-point="inputNode" type="hidden">'
        ]),
        canvasTemplate: '<canvas data-dojo-attach-point="${0}" width="180" height="50"></canvas>',

        init: function () {
            this.inherited(arguments);

            this.context = this.signatureNode.getContext('2d');
            this.context.lineWidth = this.lineWidth;
            this.context.strokeStyle = this.penColor;
        },
        createNavigationOptions: function() {
            var options = this.inherited(arguments);

            options.signature = this.signature;

            return options;
        },
        getValuesFromView: function() {
            var view = App.getPrimaryActiveView();
            if (view)
            {
                var value = view.getValues();
                this.currentValue = this.validationValue = value;
                this.setValue(this.currentValue, false);
            }
        },
        setValue: function (val, initial) {
            if (initial) this.originalValue = val;

            dojo.attr(this.inputNode, 'value', val || '');

            try {
                this.signature = JSON.parse(val);
            } catch(e) {
                this.signature = [];
            }

            if (!this.signature || Array != this.signature.constructor)
                this.signature = [];

            var size = App.views.signature_edit.getMaxSize(this.signature);
            this.scale = Math.min(
                this.signatureNode.width / size.width,
                this.signatureNode.height / size.height
            );

            this.redraw();
        },
        clearValue: function() {
            this.setValue('', true);
        },
        formatValue: function(val) {
            return val;
        },
        redraw: function () {
            App.views.signature_edit.redraw(
                this.signatureNode,
                this.signature,
                {
                    scale:     this.scale,
                    lineWidth: this.lineWidth,
                    penColor:  this.penColor
                }
            );
        }
    });

    return Sage.Platform.Mobile.FieldManager.register('signature', control);
});
