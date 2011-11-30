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
        penColor: 'red',
        sigColor: 'blue',
        context: null,
        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.signatureLabelText %}"><span aria-hidden="true">{%: $.signatureText %}</span></button>',
            '<canvas data-dojo-attach-point="signatureNode" width="180" height="50"></canvas>',
            '<input data-dojo-attach-point="inputNode" type="hidden">'
        ]),

        init: function () {
            this.inherited(arguments);

            this.context = this.signatureNode.getContext('2d');
            this.context.lineWidth = this.lineWidth;
            this.context.strokeStyle = this.sigColor;
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
                var values = view.getValues();
                this.currentValue = this.validationValue = values.signature;
                this.scale = Math.min(
                    this.signatureNode.width / values.maxWidth,
                    this.signatureNode.height / values.maxHeight
                );
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

            this.redraw();
        },
        clearValue: function() {
            this.setValue('', true);
        },
        formatValue: function(val) {
            return val;
        },
        redraw: function () {
            var x, y;
            clearCanvas(this.context);
            for (trace in this.signature) {
                this.context.beginPath();
                for (var i = 0; i < this.signature[trace].length; i++) {
                    x = this.signature[trace][i][0] * this.scale;
                    y = this.signature[trace][i][1] * this.scale;
                    if (0 == i) { this.context.moveTo(x, y); }
                    this.context.lineTo(x, y);
                    this.context.moveTo(x, y);
                }
                this.context.stroke();
            }
        },
    });

    return Sage.Platform.Mobile.FieldManager.register('signature', control);
});
