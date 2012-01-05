/// <reference path="../../../../argos-sdk/libraries/ext/ext-core-debug.js"/>
/// <reference path="../../../../argos-sdk/libraries/sdata/sdata-client-debug"/>
/// <reference path="../../../../argos-sdk/libraries/Simplate.js"/>
/// <reference path="../../../../argos-sdk/src/View.js"/>
/// <reference path="../../../../argos-sdk/src/Detail.js"/>

define('Sage/Platform/Mobile/Views/Signature', ['Sage/Platform/Mobile/View'], function() {

    return dojo.declare('Sage.Platform.Mobile.Views.Signature', [Sage.Platform.Mobile.View], {
        // Localization
        titleText: 'Signature',
        clearCanvasText: 'Erase',
        undoText: 'Undo',

        //Templates
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '{%! $.canvasTemplate %}',
                '<div class="buttons">',
                    '<button class="button" data-action="_undo"><span>{%: $.undoText %}</span></button>',
                    '<button class="button" data-action="clearValue"><span>{%: $.clearCanvasText %}</span></button>',
                '</div>',
            '<div>'
        ]),
        canvasTemplate: new Simplate([
            '<canvas data-dojo-attach-point="signatureNode" width="{%: $.canvasNodeWidth %}" height="{%: $.canvasNodeHeight %}" data-dojo-attach-event="onmousedown:_penDown,onmousemove:_penMove,onmouseup:_penUp,ontouchstart:_penDown,ontouchmove:_penMove,ontouchend:_penUp"></canvas>'
        ]),

        //View Properties
        id: 'signature_edit',
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

        show: function(options) {
            this.inherited(arguments);

            if (options && options.lineWidth) { this.config.lineWidth = options.lineWidth; }
            if (options && options.penColor)  { this.config.penColor  = options.penColor;  }
            if (options && options.drawColor) { this.config.drawColor = options.drawColor; }
            this.signature = (options && options.signature) ? options.signature : [];

            this._sizeCanvas();
            this.context = this.signatureNode.getContext('2d');

            dojo.connect(window, 'resize', this, this.onResize)

            this.redraw(this.signature, this.signatureNode, this.config);
        },
        getValues: function() {
            return JSON.stringify(this.optimizeSignature());
        },
        setValue: function(val, initial) {
            this.signature = val ? JSON.parse(val) : [];
            this.redraw(this.signature, this.signatureNode, this.config);
        },
        clearValue: function() {
            this.buffer = this.signature;
            this.setValue('', true);
        },
        // _getCoords returns pointer pixel coordinates [x,y] relative to canvas object
        _getCoords: function (e) {
            var offset = dojo.position(this.signatureNode, false);
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
            if (this.signature.length) {
                this.buffer = this.signature.pop();
                if (!this.signature.length)
                    this.buffer = [this.buffer];

            } else if (this.buffer.length) {
                this.signature = this.buffer;
            }
            this.redraw(this.signature, this.signatureNode, this.config);
        },
        _sizeCanvas: function () {
            this.canvasNodeWidth  = Math.floor(dojo.window.getBox().w * 0.92);
            this.canvasNodeHeight = Math.min(
                Math.floor(this.canvasNodeWidth * 0.5),
                dojo.window.getBox().h - dojo.query('.toolbar')[0].offsetHeight - dojo.query('.footer-toolbar')[0].offsetHeight
            );
            this.signatureNode.width  = this.canvasNodeWidth;
            this.signatureNode.height = this.canvasNodeHeight;
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
            Sage.Platform.Mobile.Format.canvasDraw(vector, canvas, options);
        },
        rescale: function (scale) {
            var rescaled = [];
            for (var i = 0; i < this.signature.length; i++) {
                rescaled.push([]);
                for (var j = 0; j < this.signature[i].length; j++) {
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
