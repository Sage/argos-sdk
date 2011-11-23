/// <reference path="../../../../argos-sdk/libraries/ext/ext-core-debug.js"/>
/// <reference path="../../../../argos-sdk/libraries/sdata/sdata-client-debug"/>
/// <reference path="../../../../argos-sdk/libraries/Simplate.js"/>
/// <reference path="../../../../argos-sdk/src/View.js"/>
/// <reference path="../../../../argos-sdk/src/Detail.js"/>

define('Sage/Platform/Mobile/Views/Signature', ['Sage/Platform/Mobile/View'], function() {

    var clearCanvas = function (context) {
        if (context && CanvasRenderingContext2D == context.constructor)
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);

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
                '<canvas data-dojo-attach-point="canvasNode" data-dojo-attach-event="onmousedown:_penDown,onmousemove:_penMove,onmouseup:_penUp,ontouchstart:_penDown,ontouchmove:_penMove,ontouchen:_penUp" width="{%: $.canvasWidth %}" height="{%: $.canvasHeight %}"></canvas>',
                '<input data-dojo-attach-point="inputNode" type="hidden">',
                '<div class="buttons">',
                    '<button class="button" data-action="_undo"><span>{%: $.undoText %}</span></button>',
                    '<button class="button" data-action="clearValue"><span>{%: $.clearCanvasText %}</span></button>',
                '</div>',
            '<div>'
        ]),

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
        buffer: null,
        // need to handle rotation/resizing
        // but what if rotation happens after starting drawing?
        // on-the-fly scaling won't work, need to "translate" to new scale
        canvasWidth: dojo.window.getBox().w, // maybe the smaller of width/height (what if on landscape mode)
        canvasHeight: dojo.window.getBox().w / 3, // 3:1 aspect ratio?

        show: function(options) {
            options = this.inherited(arguments);

            if (options && options.lineWidth) { this.lineWidth = options.lineWidth; }
            if (options && options.penColor) { this.penColor = options.penColor; }
            if (options && options.sigColor) { this.sigColor = options.sigColor; }

            this.context = this.canvasNode.getContext('2d');
            this.context.lineWidth = this.lineWidth;

            if (options && options.signature) {
                this.signature = options.signature;
                this.redraw(this.signature, this.context, this.scale);
            }
        },
        getValues: function() {
            var value = dojo.attr(this.inputNode, 'value');
            return value;
        },
        setValue: function(val, initial) {
            dojo.attr(this.inputNode, 'value', val || '');
            this.signature = val ? JSON.parse(val) : [];
            this.redraw(this.signature, this.context, this.scale);
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
                this.signature.push(this.optimize(this.trace));

            this.trace = [];
            this.redraw(this.signature, this.context, this.scale);
        },
        _undo: function () {
            if (this.signature.length) {
                this.buffer = this.signature.pop();
                if (!this.signature.length)
                    this.buffer = [this.buffer];

            } else if (this.buffer.length) {
                this.signature = this.buffer;
            }
            this.redraw(this.signature, this.context, this.scale);
            return false;
        },
        redraw: function (vector, context, scale) {
            var x, y;
            clearCanvas(context);
            scale = scale || this.scale;
            context.lineWidth = this.lineWidth * scale;
            context.strokeStyle = this.sigColor;
            for (trace in vector) {
                context.beginPath();
                for (var i = 0; i < vector[trace].length; i++) {
                    x = vector[trace][i][0] * scale;
                    y = vector[trace][i][1] * scale;
                    if (0 == i) { context.moveTo(x, y); }
                    context.lineTo(x, y);
                    context.moveTo(x, y);
                }
                context.stroke();
            }
            dojo.attr(this.inputNode, 'value', JSON.stringify(vector));
        },

        // eliminate intermediate points along a straight line
        // in practice this is only saving roughly 30%
        // disadvantage if retracing steps in reverse
        optimize: function(vector) {
            var newVector = [],
                slice_size = 0,
                currentX = -1,
                currentY = -1,
                x, y;

            for (var i = 0; i < vector.length; i++) {
                x = vector[i][0];
                y = vector[i][1];
                if (currentX == x || currentY == y) {
                    slice_size++;
                } else if (0 < slice_size) {
                    slice_size = 0;
                    if(currentX != x) {
                        newVector.push([currentX, vector[i-1][1]]);
                        currentX = x;
                    } else {
                        newVector.push([vector[i-1][0], currentY]);
                        currentY = y;
                    }
                    newVector.push([x,y]);
                } else {
                    newVector.push([x,y]);
                    currentX = x;
                    currentY = y;
                }
            }
            newVector.push(vector.pop());
            return newVector;
        }
    });
});
