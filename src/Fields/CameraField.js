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

define('Sage/Platform/Mobile/Fields/CameraField', [
    'dojo/_base/declare',
    'dojo/dom-class',
    './_Field',
    '../_TemplatedWidgetMixin'
], function(
    declare,
    domClass,
    _Field,
    _TemplatedWidgetMixin
) {

    return declare('Sage.Platform.Mobile.Fields.CameraField', [_Field, _TemplatedWidgetMixin], {
        // Localization
        cameraLabelText: 'camera',
        cameraText: '...',

        width: 256,
        height: 256,
        thumbWidth: 32,
        thumbHeight: 32,
        dataUrl: true,
        quality: 15,

        widgetTemplate: new Simplate([
            '<button data-action="onCameraClick" class="button simpleSubHeaderButton" aria-label="{%: $.cameraLabelText %}"><span aria-hidden="true">{%: $.cameraText %}</span></button>',
            '<img data-dojo-attach-point="cameraNode" src="" width="{%= $.thumbWidth %}" height="{%= $.thumbHeight %}" alt="" />',
            '<input data-dojo-attach-point="inputNode" type="hidden">'
        ]),
        cameraNode: null,

        _setSrcAttr: {node: 'cameraNode', type: 'attr', attribute: 'src'},
        _setValueAttr: {node: 'inputNode', type: 'attr', attribute: 'value'},


        startup: function() {
            this.inherited(arguments);

            if (!this.supportsCamera())
            {
                this.disable();
                domClass.add(this.containerNode, 'row-disabled');
            }
        },

        supportsCamera: function() {
            return !!navigator.camera;
        },

        onCameraClick: function() {
            if (!this.supportsCamera()) return;

            navigator.camera.getPicture(this.onCameraSuccess.bindDelegate(this), this.onCameraFail.bindDelegate(this), {
                quality: this.quality,
                destinationType: this.dataUrl ? Camera.DestinationType.DATA_URL : Camera.DestinationType.FILE_URI,
                targetWidth: this.width,
                targetHeight: this.height
            });
        },
        onCameraSuccess: function(data) {
            this.setValue(data);
        },
        onCameraFail: function(message) {
        },
        setValue: function (val, initial) {
            if (initial) this.originalValue = val;

            this.set('value', val || '');

            this.set('src', (this.dataUrl ? 'data:image/jpeg;base64,' : '') + val);
        },
        clearValue: function() {
            this.setValue('', true);
            this.set('src', '');
        },
        formatValue: function(val) {
            return val;
        }
    });
});
