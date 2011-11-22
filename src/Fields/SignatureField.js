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

define('Sage/Platform/Mobile/Fields/SignatureField', ['Sage/Platform/Mobile/FieldManager', 'Sage/Platform/Mobile/Fields/EditorField', 'Sage/Platform/Mobile/Views/Signature'], function() {

    var clear_canvas = function (ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
        pen_color: 'red',
        sig_color: 'blue',
        ctx: null,
        widgetTemplate: new Simplate([
            '<label for="{%= $.name %}">{%: $.label %}</label>',
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.signatureLabelText %}"><span aria-hidden="true">{%: $.signatureText %}</span></button>',
            '<canvas data-dojo-attach-point="signatureNode" width="180" height="50"></canvas>',
            '<input data-dojo-attach-point="inputNode" type="hidden">'
        ]),

        init: function () {
            this.inherited(arguments);

            this.ctx = this.signatureNode.getContext('2d');
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.strokeStyle = this.sig_color;
        },
        getValuesFromView: function() {
            var view = App.getPrimaryActiveView();
            if (view)
            {
                this.currentValue = view.getValues();
                this.setValue(this.currentValue, false);
            }
        },
        setValue: function (val, initial) {
            if (initial) this.originalValue = val;

            dojo.attr(this.inputNode, 'value', val || '');

            this.signature = val ? JSON.parse(val) : [];

            this.redraw();
        },
        clearValue: function() {
            this.setValue('', true);
        },
        redraw: function () {
            var x, y;
            clear_canvas(this.ctx);
            for (trace in this.signature) {
                this.ctx.beginPath();
                for (var i = 0; i < this.signature[trace].length; i++) {
                    x = this.signature[trace][i][0] * this.scale;
                    y = this.signature[trace][i][1] * this.scale;
                    if (0 == i) { this.ctx.moveTo(x, y); }
                    this.ctx.lineTo(x, y);
                    this.ctx.moveTo(x, y);
                }
                this.ctx.stroke();
            }
        },
    });

    return Sage.Platform.Mobile.FieldManager.register('signature', control);
});