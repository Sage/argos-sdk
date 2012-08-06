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

define('Sage/Platform/Mobile/Views/Signature', [
    'dojo/_base/declare',
    'dojo/_base/json',
    'dojo/query',
    'dojo/dom-geometry',
    'dojo/window',
    '../Format',
    '../ScrollContainer',
    '../View'
], function(
    declare,
    json,
    query,
    domGeom,
    win,
    format,
    ScrollContainer,
    View
) {

    return declare('Sage.Platform.Mobile.Views.Signature', [View], {
        // Localization
        titleText: 'Signature',
        clearCanvasText: 'Erase',
        undoText: 'Undo',

        //Templates
        events: {
            'click': true
        },
        components: [
            {name: 'fix', content: '<a href="#" class="android-6059-fix">fix for android issue #6059</a>'},
            {name: 'scroller', type: ScrollContainer, subscribeEvent: 'onContentChange:onContentChange', components: [
                {name: 'scroll', tag: 'div', components: [
                    {name: 'canvas', tag: 'canvas', attrs: {'class': 'signature-canvas', width: 360, height: 120}, attachPoint: 'signatureNode', attachEvent: 'onmousedown:_penDown,onmousemove:_penMove,onmouseup:_penUp,ontouchstart:_penDown,ontouchmove:_penMove,ontouchend:_penUp'},
                    {name: 'buttons', tag: 'div', attrs: {'class': 'signature-buttons'}, components: [
                        {name: 'undo', content: Simplate.make('<button class="button" data-action="_undo"><span>{%: $.undoText %}</span></button>')},
                        {name: 'clear', content: Simplate.make('<button class="button" data-action="clearValue"><span>{%: $.clearCanvasText %}</span></button>')}
                    ]}
                ]}
            ]}
        ],
        baseClass: 'view signature-view',
        signatureNode: null,

        //View Properties
        id: 'signature_edit',
        tier: 1,
        expose: false,
        signature: [],
        trace: [],
        lastpos: {x:-1, y:-1},
        config: {
            scale: 1,
            lineWidth: 3,
            penColor: 'blue',
            drawColor: 'red'
        },
        isPenDown: false,
        context: null,
        buffer: [],
        canvasNodeWidth: 360, // starting default size
        canvasNodeHeight: 120, // adjusted on show()

        onStartup: function() {
            this.inherited(arguments);

            this.context = this.signatureNode.getContext('2d');
        },
        resize: function() {
            this.inherited(arguments);
            this.onResize();
        },
        onBeforeTransitionTo: function() {
            this.inherited(arguments);
            var options = this.options;

            if (options && options.lineWidth) { this.config.lineWidth = options.lineWidth; }
            if (options && options.penColor)  { this.config.penColor  = options.penColor;  }
            if (options && options.drawColor) { this.config.drawColor = options.drawColor; }
            this.signature = (options && options.signature) ? options.signature : [];
        },
        getValues: function() {
            return json.toJson(this.optimizeSignature());
        },
        setValue: function(val, initial) {
            this.signature = val ? json.fromJson(val) : [];
            this.redraw(this.signature, this.signatureNode, this.config);
        },
        clearValue: function() {
            this.buffer = this.signature;
            this.setValue('', true);
        },
        // _getCoords returns pointer pixel coordinates [x,y] relative to canvas object
        _getCoords: function (e) {
            var offset = domGeom.position(this.signatureNode, false);
            return e.touches
                ? [
                    e.touches[0].pageX - offset.x,
                    e.touches[0].pageY - offset.y
                  ]
                : [
                    e.clientX - offset.x,
                    e.clientY - offset.y
                  ]
                ;
        },
        _penDown: function (e) {
            this.isPenDown = true;
            this.lastpos = this._getCoords(e);
            this.context.lineWidth = this.config.lineWidth;
            this.context.strokeStyle = this.config.drawColor;
            e.preventDefault();
        },
        _penMove: function (e) {
            if (!this.isPenDown) { return; }
            this.pos = this._getCoords(e);
            e.preventDefault();
            this.context.beginPath();
            this.context.moveTo(this.lastpos[0], this.lastpos[1]);
            this.context.lineTo(this.pos[0], this.pos[1]);
            this.context.closePath();
            this.context.stroke();
            e.preventDefault();
            this.lastpos = this.pos;
            this.trace.push(this.pos);
        },
        _penUp: function (e) {
            e.preventDefault();
            this.isPenDown = false;
            if (this.trace.length)
                this.signature.push(this.trace);

            this.trace = [];
            this.context.strokeStyle = this.config.penColor;
            this.redraw(this.signature, this.signatureNode, this.config);
        },
        _undo: function () {
            if (this.signature.length)
            {
                this.buffer = this.signature.pop();
                if (!this.signature.length)
                    this.buffer = [this.buffer];

            } else if (this.buffer.length)
            {
                this.signature = this.buffer;
            }
            this.redraw(this.signature, this.signatureNode, this.config);
        },
        _sizeCanvas: function () {
            this.canvasNodeWidth  = this.calculateWidth();
            this.canvasNodeHeight = this.calculateHeight();

            this.signatureNode.width  = this.canvasNodeWidth;
            this.signatureNode.height = this.canvasNodeHeight;
        },
        calculateWidth: function() {
            return Math.floor(win.getBox().w * 0.92);
        },
        calculateHeight: function() {
            return Math.min(Math.floor(this.canvasNodeWidth * 0.5),
                            win.getBox().h - query('.toolbar')[0].offsetHeight - query('.toolbar-bottom')[0].offsetHeight
                        );
        },
        onResize: function (e) {
            var newScale,
                oldWidth  = this.canvasNodeWidth,
                oldHeight = this.canvasNodeHeight;
            this._sizeCanvas();

            newScale = Math.min(
                this.canvasNodeWidth  / oldWidth,
                this.canvasNodeHeight / oldHeight
            );

            this.signature = this.rescale(newScale);
            this.redraw(this.signature, this.signatureNode, this.config);
        },
        redraw: function (vector, canvas, options) {
            format.canvasDraw(vector, canvas, options);
            this.onContentChange();
        },
        rescale: function (scale) {
            var rescaled = [];
            for (var i = 0; i < this.signature.length; i++)
            {
                rescaled.push([]);
                for (var j = 0; j < this.signature[i].length; j++)
                {
                    rescaled[i].push([
                        this.signature[i][j][0] * scale,
                        this.signature[i][j][1] * scale
                    ])
                }
            }
            return rescaled;
        },
        optimizeSignature: function() {
            var optimized = [];

            for (var i = 0; i < this.signature.length; i++)
                optimized.push(this.optimize(this.signature[i]))

            return optimized;
        },
        optimize: function(vector) {
            if (vector.length < 2) return vector;

            var result = [],
                minA = 0.95,
                maxL = 15.0, // 15.0, 10.0 works well
                rootP = vector[0],
                lastP = vector[1],
                rootV = [lastP[0] - rootP[0], lastP[1] - rootP[1]],
                rootL = Math.sqrt(rootV[0]*rootV[0] + rootV[1]*rootV[1]),
                currentP,
                currentV,
                currentL,
                dotProduct;

            for (var i = 2; i < vector.length; i++)
            {
                currentP = vector[i];
                currentV = [currentP[0] - rootP[0], currentP[1] - rootP[1]];
                currentL = Math.sqrt(currentV[0]*currentV[0] + currentV[1]*currentV[1]);
                dotProduct = (rootV[0]*currentV[0] + rootV[1]*currentV[1]) / (rootL*currentL);

                if (dotProduct < minA || currentL > maxL)
                {
                    result.push(rootP);

                    rootP = lastP;
                    lastP = currentP;
                    rootV = [lastP[0] - rootP[0], lastP[1] - rootP[1]];
                    rootL = Math.sqrt(rootV[0]*rootV[0] + rootV[1]*rootV[1]);
                }
                else
                {
                    lastP = currentP;
                }

            }

            result.push(lastP);

            return result;
        }
    });
});