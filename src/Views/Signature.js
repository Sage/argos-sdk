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
 * Signature View is a view tailored to present an HTML5 canvas that has signature-recording capabilities.
 *
 * It goes hand-in-hand with {@link SignatureField SignatureField}
 *
 * @alternateClassName SignatureView
 * @extends View
 * @requires format
 */
define('Sage/Platform/Mobile/Views/Signature', [
    'dojo/_base/declare',
    'dojo/_base/json',
    'dojo/query',
    'dojo/dom-geometry',
    'dojo/window',
    'Sage/Platform/Mobile/Format',
    'Sage/Platform/Mobile/View'
], function(
    declare,
    json,
    query,
    domGeom,
    win,
    format,
    View
) {

    return declare('Sage.Platform.Mobile.Views.Signature', [View], {
        // Localization
        /**
         * @property {String}
         * Text shown in the top toolbar header
         */
        titleText: 'Signature',
        /**
         * @property {String}
         * Text shown in the clear button
         */
        clearCanvasText: 'Erase',
        /**
         * @property {String}
         * Text shown in the undo button
         */
        undoText: 'Undo',

        //Templates
        /**
         * @property {Simplate}
         * Simplate that defines the HTML Markup
         *
         * * `$` => Signature view instance
         *
         */
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '{%! $.canvasTemplate %}',
                '<div class="buttons">',
                    '<button class="button" data-action="_undo"><span>{%: $.undoText %}</span></button>',
                    '<button class="button" data-action="clearValue"><span>{%: $.clearCanvasText %}</span></button>',
                '</div>',
            '<div>'
        ]),
        /**
         * @property {Simplate}
         * Simplate that defines the canvas with a set width and height
         */
        canvasTemplate: new Simplate([
            '<canvas data-dojo-attach-point="signatureNode" width="{%: $.canvasNodeWidth %}" height="{%: $.canvasNodeHeight %}" data-dojo-attach-event="onmousedown:_penDown,onmousemove:_penMove,onmouseup:_penUp,ontouchstart:_penDown,ontouchmove:_penMove,ontouchend:_penUp"></canvas>'
        ]),
        /**
         * @property {HTMLElement}
         * The dojo-attach-point for the canvas element
         */
        signatureNode: null,

        //View Properties
        /**
         * @property {String}
         * The unique view id
         */
        id: 'signature_edit',
        /**
         * @property {Boolean}
         * Flag that may be used to control if the view is shown in configurable lists
         */
        expose: false,
        /**
         * @property {Number[][]}
         * Stores series of x,y coordinates in the format of: `[[0,0],[1,5]]`
         */
        signature: [],
        /**
         * @property {Number[][]}
         * Collection of the touchmove positions
         */
        trace: [],
        /**
         * @property {Object}
         * Stores where the last drawn point was
         */
        lastpos: {x:-1, y:-1},
        /**
         * @cfg {Object}
         * Stores the passed options for: `scale`, `lineWidth`, `penColor` and `drawColor`.
         */
        config: {
            scale: 1,
            lineWidth: 3,
            penColor: 'blue',
            drawColor: 'red'
        },
        /**
         * @property {Boolean}
         * Flag for determining if the pen is in "down" state.
         */
        isPenDown: false,
        /**
         * @property {Object}
         * The stored 2d context of the canvas node
         */
        context: null,
        /**
         * @property {Number[][]}
         * Used to temporarily store the signature
         */
        buffer: [],
        /**
         * @cfg {Number}
         * Starting default width of canvas, will be re-sized when the view is shown.
         */
        canvasNodeWidth: 360,
        /**
         * @cfg {Number}
         * Starting default height of canvas, will be re-sized when the view is shown.
         */
        canvasNodeHeight: 120,

        /**
         * Extends parent implementation to store the options to `this.config`, subscribe to the
         * `/app/resize` event and immediately call resize so the canvas is scaled.
         * @param options
         */
        show: function(options) {
            this.inherited(arguments);

            if (options && options.lineWidth) { this.config.lineWidth = options.lineWidth; }
            if (options && options.penColor)  { this.config.penColor  = options.penColor;  }
            if (options && options.drawColor) { this.config.drawColor = options.drawColor; }
            this.signature = (options && options.signature) ? options.signature : [];

            this._sizeCanvas();
            this.context = this.signatureNode.getContext('2d');

            this.subscribe('/app/resize', this.onResize);

            this.redraw(this.signature, this.signatureNode, this.config);
        },
        /**
         * Returns the optimized signature array as a JSON string
         * @return {String}
         */
        getValues: function() {
            return json.toJson(this.optimizeSignature());
        },
        /**
         * Sets the current value and draws it.
         * @param {String} val JSON-stringified Number[][] of x-y coordinates
         * @param initial Unused.
         */
        setValue: function(val, initial) {
            this.signature = val ? json.fromJson(val) : [];
            this.redraw(this.signature, this.signatureNode, this.config);
        },
        /**
         * Clears the value and saves the buffer
         */
        clearValue: function() {
            this.buffer = this.signature;
            this.setValue('', true);
        },
        /**
         * Returns pointer pixel coordinates [x,y] relative to canvas object
         * @param {Event} e
         * @return Number[]
         */
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
        /**
         * Handler for `ontouchstart`, records the starting point and sets the state to down
         * @param {Event} e
         */
        _penDown: function (e) {
            this.isPenDown = true;
            this.lastpos = this._getCoords(e);
            this.context.lineWidth = this.config.lineWidth;
            this.context.strokeStyle = this.config.drawColor;
            e.preventDefault();
        },
        /**
         * Handler for `ontouchmove`, draws the lines between the last postition and current position
         * @param {Event} e
         */
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
        /**
         * Handler for `ontouchend`, saves the final signature and redraws the canvas
         * @param e
         */
        _penUp: function (e) {
            e.preventDefault();
            this.isPenDown = false;
            if (this.trace.length)
                this.signature.push(this.trace);

            this.trace = [];
            this.context.strokeStyle = this.config.penColor;
            this.redraw(this.signature, this.signatureNode, this.config);
        },
        /**
         * Undoes the last pen down-to-pen up line by using the buffer
         */
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
        /**
         * Sets the canvas width/height based on the size of the window/screen
         */
        _sizeCanvas: function () {
            this.canvasNodeWidth  = Math.floor(win.getBox().w * 0.92);

            this.canvasNodeHeight = Math.min(
                Math.floor(this.canvasNodeWidth * 0.5),
                win.getBox().h - query('.toolbar')[0].offsetHeight - query('.footer-toolbar')[0].offsetHeight
            );

            this.signatureNode.width  = this.canvasNodeWidth;
            this.signatureNode.height = this.canvasNodeHeight;
        },
        /**
         * Calls {@link #_sizeCanvas _sizeCanvas} to size the canvas itself then it also scales the
         * drawn signature accordingly to the ratio.
         * @param e
         */
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
        /**
         * Calls {@link format#canvasDraw format.canvasDraw} which clears and draws the vectors
         * @param {Number[][]} vector The x-y coordinates of the points
         * @param {HTMLElement} canvas Canvas to be drawn to
         * @param {Object} options Options to be passed to canvasDraw
         */
        redraw: function (vector, canvas, options) {
            format.canvasDraw(vector, canvas, options);
        },
        /**
         * Loops through the vector points in the signature and applies the given scale ratio
         * @param {Number} scale Ratio in which to multiply the vector point
         * @return {Number[][]} Rescaled signature array
         */
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
        /**
         * Loops the signature calling optimize on each pen down-to-pen up segment
         * @return {Number[][]} Optimized signature
         */
        optimizeSignature: function() {
            var optimized = [];

            for (var i = 0; i < this.signature.length; i++)
                optimized.push(this.optimize(this.signature[i]))

            return optimized;
        },
        /**
         * Attempts to remove points by comparing the x/y variation between the two and
         * removing points within a certain threshold.
         * @param {Number[]} vector Array of x,y coordinates to optimize
         * @return {Number[]} Optimized array
         */
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