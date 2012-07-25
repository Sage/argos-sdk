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
    'dojo/_base/lang',
    'dojo/_base/config',
    'dojo/dom-class',
    'dojo/dom-attr',
    './_Field',
    '../_TemplatedWidgetMixin',
    '../_EventMapMixin'
], function(
    declare,
    lang,
    config,
    domClass,
    domAttr,
    _Field,
    _TemplatedWidgetMixin,
    _EventMapMixin
) {

    return declare('Sage.Platform.Mobile.Fields.CameraField', [_Field, _EventMapMixin, _TemplatedWidgetMixin], {
        events: {
            'click': '_onClick'
        },

        // Localization
        cameraLabelText: 'camera',
        cameraText: '...',

        width: 256,
        height: 256,
        thumbWidth: 64,
        thumbHeight: 64,
        dataUrl: true,
        quality: 15,

        widgetTemplate: new Simplate([
            '<button class="button simpleSubHeaderButton" aria-label="{%: $.cameraLabelText %}"><span aria-hidden="true">{%: $.cameraText %}</span></button>',
            '<img data-dojo-attach-point="imageNode" src="" width="{%= $.thumbWidth %}" height="{%= $.thumbHeight %}" alt="" />',
            '<input data-dojo-attach-point="inputNode" type="hidden">'
        ]),
        imageNode: null,

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

        _onClick: function() {
            if (!this.supportsCamera()) return;

            navigator.camera.getPicture(
                lang.hitch(this, this._onGetPictureSuccess),
                lang.hitch(this, this._onGetPictureError),
                {
                    quality: this.quality,
                    destinationType: this.dataUrl ? Camera.DestinationType.DATA_URL : Camera.DestinationType.FILE_URI,
                    encodingType: Camera.EncodingType.JPEG,
                    targetWidth: this.width,
                    targetHeight: this.height
                }
            );
        },
        _onGetPictureSuccess: function(data) {
            this.setValue(data);
        },
        _onGetPictureError: function(message) {
            console.log('camera failure:');
            console.log(message);
        },
        setValue: function (val, initial) {
            if (initial) this.originalValue = val;

            var complete = (this.dataUrl && val ? 'data:image/jpeg;base64,' : '') + (val || '');

            this.set('value', complete || '');

            domAttr.set(this.imageNode, 'src', val ? complete : (config.blankGif || ''));
        },
        getValue: function() {
            return this.get('value');
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
