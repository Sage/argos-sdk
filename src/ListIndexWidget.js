define('argos/ListIndexWidget', [
    'dojo/_base/declare',
    'dojo/query',
    'dojo/dom-geometry',
    'dojo/window',
    'dijit/_WidgetBase',
    './_TemplatedWidgetMixin'
], function(
    declare,
    query,
    domGeom,
    win,
    _WidgetBase,
    _TemplatedWidgetMixin
) {
    return declare('argos.ListIndexWidget', [_WidgetBase, _TemplatedWidgetMixin], {
		// default properties
		indexList: null, // should be a collection of key:value pairs
		defaultList: 'A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z'.split(','),
		width: 30, // pixels
		height: 260, // will be dynamically adjusted by viewport

        /**
         * @property {Simplate}
         * Simple that defines the HTML Markup
         */
        widgetTemplate: new Simplate([
            '<div class="list-index">',
                '<ul class="index-widget" data-dojo-attach-point="indexWidgetNode">',
                '</ul>',
            '</div>'
        ]),

		itemTemplate: new Simplate(['<li data-key="{%= $.i %}">{%= $$.indexList[$.i] %}</li>']),

        queryNode: null,

        startUp: function() {
            // when no indexList of key/value pairs given, default to Alphabetical list
            if (!this.indexList) {
                this.indexList = {};
                for (var i in this.defaultList)
                    this.indexList[this.defaultList[i]] = this.defaultList[i];

            }
            // populate and display index DOM structure
            for (i in this.indexList) {
                node = dojo.create('li', {"data-key": i, innerHTML: this.indexList[i]}, this.indexWidgetNode);
            }

        },
        /**
         * This function is invoked from the search button and it:
         *
         * * Gathers the inputted search text; and
         * * Fires the {@link #onQuery onQuery} event which {@link List#_onSearchQuery List} listens to by default.
         */
        search: function() {
            var query = this.queryNode.value;

            this.onQuery(query);
        },
        /**
         * Event that is fired on search, a View should bind this function to a listener.
         * @param {String} query Search text inputted
         */
        onQuery: function(query) {
        },
        // _getCoords returns pointer pixel coordinates [x,y] relative to canvas object
        _getCoords: function (e) {
            var offset = domGeom.position(this.listIndexNode, false);
            return e.touches ?
                [
                    e.touches[0].pageX - offset.x,
                    e.touches[0].pageY - offset.y
                  ] :
                [
                    e.clientX - offset.x,
                    e.clientY - offset.y
                  ];
        },
        _touchDown: function (e) {
            this.isPenDown = true;
            this.lastpos = this._getCoords(e);
            e.preventDefault();
        },
        _touchMove: function (e) {
            if (!this.isPenDown) { return; }
            this.pos = this._getCoords(e);
            e.preventDefault();
            this.lastpos = this.pos;
        },
        _touchUp: function (e) {
            e.preventDefault();
            this.isPenDown = false;

			// if we know which letter had focus up to touchUp
			// navigate/search for it
        },
        _sizeCanvas: function () {
            this.canvasNodeWidth  = this.calculateWidth();
            this.canvasNodeHeight = this.calculateHeight();

            this.signatureNode.width  = this.canvasNodeWidth;
            this.signatureNode.height = this.canvasNodeHeight;
        },
        calculateWidth: function() {
            return Math.floor(domGeom.getMarginBox(this.domNode).w * 0.92);
        },
        calculateHeight: function() {
            var topToolbar = query('.toolbar', this.domNode),
                topToolbarHeight = (topToolbar.length > 0) ? topToolbar[0].offsetHeight : 0;

            return Math.min(Math.floor(this.canvasNodeWidth * 0.5), win.getBox().h - topToolbarHeight);
        },
        onResize: function (e) {
            // will need to also scale font size
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
        }
    });
});
