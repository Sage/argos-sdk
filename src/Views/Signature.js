/// <reference path="../../../../argos-sdk/libraries/ext/ext-core-debug.js"/>
/// <reference path="../../../../argos-sdk/libraries/sdata/sdata-client-debug"/>
/// <reference path="../../../../argos-sdk/libraries/Simplate.js"/>
/// <reference path="../../../../argos-sdk/src/View.js"/>
/// <reference path="../../../../argos-sdk/src/Detail.js"/>

define('Sage/Platform/Mobile/Views/Signature', ['Sage/Platform/Mobile/View'], function() {

    var clear_canvas = function (ctx) {
        if (ctx && CanvasRenderingContext2D == ctx.constructor)
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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
                '<canvas data-dojo-attach-point="canvasNode" width="300" height="100"></canvas>',
                '<input data-dojo-attach-point="inputNode" type="hidden">',
                '<button class="button" data-action="_undo"><span>{%: $.undoText %}</span></button>',
                '<button class="button" data-action="clearValue"><span>{%: $.clearCanvasText %}</span></button>',
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
        pen_color: 'red',
        sig_color: 'blue',
        is_pen_down: false,
        ctx: null,

        show: function(options) {
            options = this.inherited(arguments);

            if (options && options.lineWidth) { this.lineWidth = options.lineWidth; }
            if (options && options.pen_color) { this.pen_color = options.pen_color; }
            if (options && options.sig_color) { this.sig_color = options.sig_color; }

            this.ctx = this.canvasNode.getContext('2d');
            this.ctx.lineWidth = this.lineWidth;

            dojo.connect(this.canvasNode, 'onmousedown', this, this._pen_down);
            dojo.connect(this.canvasNode, 'onmousemove', this, this._pen_move);
            dojo.connect(this.canvasNode, 'onmouseup',   this, this._pen_up);

            dojo.connect(this.canvasNode, 'ontouchstart', this, this._pen_down);
            dojo.connect(this.canvasNode, 'ontouchmove',  this, this._pen_move);
            dojo.connect(this.canvasNode, 'ontouchend',   this, this._pen_up);

            if (options && options.signature) {
                this.signature = options.signature;
                this.redraw(this.signature, this.ctx, this.scale);
            }
        },
        getValues: function() {
            var value = dojo.attr(this.inputNode, 'value');
            return value;
        },
        setValue: function(val, initial) {
            dojo.attr(this.inputNode, 'value', val || '');
            this.signature = val ? JSON.parse(val) : [];
            this.redraw(this.signature, this.ctx, this.scale);
        },
        clearValue: function() {
            this.setValue('', true);
            clear_canvas(this.ctx);
        },
        // _get_coords returns pointer pixel coordinates [x,y] relative to canvas object
        _get_coords: function (e) {
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
        _pen_down: function (e) {
            this.is_pen_down = true;
            this.lastpos = this._get_coords(e);
        },
        _pen_move: function (e) {
            if (!this.is_pen_down) { return; }
            this.pos = this._get_coords(e);
            this.ctx.strokeStyle = this.pen_color;
            this.ctx.beginPath();
            this.ctx.moveTo(this.lastpos[0], this.lastpos[1]);
            this.ctx.lineTo(this.pos[0], this.pos[1]);
            this.ctx.closePath();
            this.ctx.stroke();
            this.lastpos = this.pos;
            this.trace.push(this.pos);
        },
        _pen_up: function (e) {
            this.is_pen_down = false;
            if (this.trace.length)
                this.signature.push(this.optimize(this.trace));

            this.trace = [];
            this.redraw(this.signature, this.ctx, this.scale);
        },
        _undo: function () {
            if (this.signature.length) {
                var throw_away = this.signature.pop();
                this.redraw(this.signature, this.ctx, this.scale);
            }
            return false;
        },
        redraw: function (vector, ctx, scale) {
            var x, y;
            clear_canvas(ctx);
            scale = scale || this.scale;
            ctx.lineWidth = this.lineWidth * scale;
            ctx.strokeStyle = this.sig_color;
            for (trace in vector) {
                ctx.beginPath();
                for (var i = 0; i < vector[trace].length; i++) {
                    x = vector[trace][i][0] * scale;
                    y = vector[trace][i][1] * scale;
                    if (0 == i) { ctx.moveTo(x, y); }
                    ctx.lineTo(x, y);
                    ctx.moveTo(x, y);
                }
                ctx.stroke();
            }
            dojo.attr(this.inputNode, 'value', JSON.stringify(vector));
        },

        // eliminate intermediate points along a straight line
        // in practice this is only saving roughly 30%
        // disadvantage if retracing steps in reverse
        optimize: function(vector) {
            var new_vector = [],
                slice_size = 0,
                current_x = -1,
                current_y = -1,
                x, y;

            for (var i = 0; i < vector.length; i++) {
                x = vector[i][0];
                y = vector[i][1];
                if (current_x == x || current_y == y) {
                    slice_size++;
                } else if (0 < slice_size) {
                    slice_size = 0;
                    if(current_x != x) {
                        new_vector.push([current_x, vector[i-1][1]]);
                        current_x = x;
                    } else {
                        new_vector.push([vector[i-1][0], current_y]);
                        current_y = y;
                    }
                    new_vector.push([x,y]);
                } else {
                    new_vector.push([x,y]);
                    current_x = x;
                    current_y = y;
                }
            }
            new_vector.push(vector.pop());
            // console.log(100 - Math.floor((JSON.stringify(new_vector).length/JSON.stringify(vector).length)*100) + '% compressed.');
            return new_vector;
        }
    });
});
