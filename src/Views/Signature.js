/// <reference path="../../../../argos-sdk/libraries/ext/ext-core-debug.js"/>
/// <reference path="../../../../argos-sdk/libraries/sdata/sdata-client-debug"/>
/// <reference path="../../../../argos-sdk/libraries/Simplate.js"/>
/// <reference path="../../../../argos-sdk/src/View.js"/>
/// <reference path="../../../../argos-sdk/src/Detail.js"/>

define('Sage/Platform/Mobile/Views/Signature', ['Sage/Platform/Mobile/View'], function() {

    var clearCanvas = function (context) {
        if (context && CanvasRenderingContext2D == context.constructor)
            // Paint white instead of clearing because on Android toHTMLImage messes alpha pixels
            //context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            context.fillStyle = 'rgb(255,255,255)';
            context.fillRect (0, 0, context.canvas.width, context.canvas.height);

        return false;
    }

    return dojo.declare('Sage.Platform.Mobile.Views.Signature', [Sage.Platform.Mobile.View], {
        // Localization
        titleText: 'Signature',
        clearCanvasText: 'Erase',
        undoText: 'Undo',

        //Templates
        widgetTemplate: new Simplate([
            '<div id="{%= $.id %}" title="{%: $.titleText %}" class="panel {%= $.cls %}">',
                '<canvas data-dojo-attach-point="canvasNode" data-dojo-attach-event="onmousedown:_penDown,onmousemove:_penMove,onmouseup:_penUp,ontouchstart:_penDown,ontouchmove:_penMove,ontouchend:_penUp" width="{%: $.canvasWidth %}" height="{%: $.canvasHeight %}"></canvas>',
                '<div class="buttons">',
                    '<button class="button" data-action="_undo"><span>{%: $.undoText %}</span></button>',
                    '<button class="button" data-action="clearValue"><span>{%: $.clearCanvasText %}</span></button>',
                '</div>',
            '<div>'
        ]),
        HTMLImageTemplate: '<img src="${0}" width="${1}" height="${2}" alt="" />',

        //View Properties
        id: 'signature_edit',
        expose: false,
        signature: [],
        trace: [],
        lastpos: {x:-1, y:-1},
        lineWidth: 3.0,
        scale: 1.0,
        penColor: 'red',
        sigColor: 'blue',
        isPenDown: false,
        context: null,
        buffer: [],
        canvasWidth: 360, // starting default size
        canvasHeight: 120, // adjusted on show()

        show: function(options) {
            this.inherited(arguments);

            if (options && options.lineWidth) { this.lineWidth = options.lineWidth; }
            if (options && options.penColor)  { this.penColor  = options.penColor;  }
            if (options && options.sigColor)  { this.sigColor  = options.sigColor;  }
            this.signature = (options && options.signature) ? options.signature : [];

            this._sizeCanvas();
            this.context = this.canvasNode.getContext('2d');

            dojo.connect(window, 'resize', this, this.onResize)

            this.redraw(this.canvasNode, this.signature);
        },
        getValues: function() {
            return JSON.stringify(this.optimizeSignature());
        },
        setValue: function(val, initial) {
            this.signature = val ? JSON.parse(val) : [];
            this.redraw(this.canvasNode, this.signature);
        },
        clearValue: function() {
            this.buffer = this.signature;
            this.setValue('', true);
            clearCanvas(this.context);
        },
        // _getCoords returns pointer pixel coordinates [x,y] relative to canvas object
        _getCoords: function (e) {
            var offset = dojo.position(this.canvasNode, false);
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
            this.context.lineWidth = this.lineWidth;
            this.context.strokeStyle = this.penColor;
            e.preventDefault();
        },
        _penMove: function (e) {
            if (!this.isPenDown) { return; }
            this.pos = this._getCoords(e);
            this.context.strokeStyle = this.penColor;
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
            this.context.strokeStyle = this.sigColor;
            this.redraw(this.canvasNode, this.signature);
        },
        _undo: function () {
            if (this.signature.length) {
                this.buffer = this.signature.pop();
                if (!this.signature.length)
                    this.buffer = [this.buffer];

            } else if (this.buffer.length) {
                this.signature = this.buffer;
            }
            this.redraw(this.canvasNode, this.signature);
        },
        _sizeCanvas: function () {
            this.canvasWidth  = Math.floor(dojo.window.getBox().w * 0.92);
            this.canvasHeight = Math.min(
                Math.floor(this.canvasWidth * 0.5),
                dojo.window.getBox().h - dojo.query('.toolbar')[0].offsetHeight - dojo.query('.footer-toolbar')[0].offsetHeight
            );
            this.canvasNode.width  = this.canvasWidth;
            this.canvasNode.height = this.canvasHeight;
        },
        onResize: function (e) {
            var newScale,
                oldWidth  = this.canvasWidth,
                oldHeight = this.canvasHeight;
            this._sizeCanvas();
            newScale = Math.min(
                this.canvasWidth  / oldWidth,
                this.canvasHeight / oldHeight
            );
            this.signature = this.rescale(newScale);
            this.redraw(this.canvasNode, this.signature);
        },
        redraw: function (canvas, vector, options) {
            var x, y,
                context = canvas.getContext('2d');

            clearCanvas(context);

            scale               = options && options.scale     ? options.scale     : this.scale;
            context.lineWidth   = options && options.lineWidth ? options.lineWidth : this.lineWidth;
            context.strokeStyle = options && options.penColor  ? options.penColor  : this.sigColor;

            for (trace in vector) {
                if ( 1 < vector[trace].length) {
                    context.beginPath();
                    context.moveTo(vector[trace][0][0] * scale, vector[trace][0][1] * scale);
                    for (var i = 1; i < vector[trace].length; i++) {
                        x = vector[trace][i][0] * scale;
                        y = vector[trace][i][1] * scale;
                        context.lineTo(x, y);
                    }
                    context.stroke();
                }
            }
        },
        draw: function (canvas, signature, options) {
            if (0 < options.width ) { canvas.width  = options.width;  }
            if (0 < options.height) { canvas.height = options.height; }

            if (typeof signature == 'string' || signature instanceof String)
                try { signature = JSON.parse(signature); } catch(e) {}

            if (!(signature instanceof Array))
                return;

            var size = this.getMaxSize(signature);
            options.scale = Math.min(
                canvas.width / size.width,
                canvas.height / size.height
            );

            this.redraw(canvas, signature, options);
        },
        toHTMLImage: function (signature, options) {
            this.draw(this.canvasNode, signature, options);
            var img = this.canvasNode.toDataURL('image/png');
            if (img.indexOf("data:image/png") != 0)
                img = Canvas2Image.saveAsBMP(this.canvasNode, true).src;

            return dojo.string.substitute(this.HTMLImageTemplate, [img, options.width, options.height]);
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
        getMaxSize: function(signature) {
            var w = h = 1;
            for (var i = 0; i < signature.length; i++) {
                for (var j = 0; j < signature[i].length; j++) {
                    if (w < signature[i][j][0]) { w = signature[i][j][0]; }
                    if (h < signature[i][j][1]) { h = signature[i][j][1]; }
                }
            }
            // maybe should return bounding box? (x,y,w,h)
            return { width: w, height: h };
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
