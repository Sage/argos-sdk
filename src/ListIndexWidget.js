define('argos/ListIndexWidget', [
    'dojo/_base/declare',
    'dojo/query',
    'dojo/dom-class',
    'dojo/dom-geometry',
    'dojo/window',
    'dijit/_WidgetBase',
    './_TemplatedWidgetMixin'
], function(
    declare,
    query,
    domClass,
    domGeom,
    win,
    _WidgetBase,
    _TemplatedWidgetMixin
) {
    return declare('argos.ListIndexWidget', [_WidgetBase, _TemplatedWidgetMixin], {
		// default properties
		indexList: null, // should be a collection of key:value pairs
		defaultList: 'A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z'.split(','),
        selection: null,
		width: 30, // pixels
		height: 260, // will be dynamically adjusted by viewport
        isPenDown: false,

        /**
         * @property {Simplate}
         * Simple that defines the HTML Markup
         */
        widgetTemplate: new Simplate([
            '<div class="list-index">',
                '<div class="tooltip hidden" data-dojo-attach-point="tooltipNode"></div>',
                '<ul class="index-widget" data-dojo-attach-point="indexWidgetNode" data-dojo-attach-event="onmousedown:_touchDown,onmousemove:_touchMove,onmouseup:_touchUp,ontouchstart:_touchDown,ontouchmove:_touchMove,ontouchend:_touchUp"></ul>',
            '</div>'
        ]),

		itemTemplate: new Simplate(['<li data-key="{%= $.i %}">{%= $$.indexList[$.i] %}</li>']),

        queryNode: null,

        startUp: function() {
            // when no indexList of key/value pairs given, default to Alphabetical list
            if (!this.indexList) {
                this.indexList = [];
                for (var i in this.defaultList)
                    this.indexList.push({key: this.defaultList[i], value: this.defaultList[i]});

            }
            // populate and display index DOM structure
            for (i = 0; i < this.indexList.length; i++) {
                node = dojo.create('li', {innerHTML: this.indexList[i].value}, this.indexWidgetNode);
            }

        },
        /**
         * Event that is fired on search, a View should bind this function to a listener.
         * @param {String} query Search text inputted
         */
        onQuery: function(query) {
        },
        // _getCoords returns pointer pixel coordinates [x,y] relative to canvas object
        _getCoords: function (e) {
            var offset = domGeom.position(this.indexWidgetNode, false);
            return e.touches ?
                [ e.touches[0].pageX - offset.x,
                  e.touches[0].pageY - offset.y ] :
                [ e.clientX - offset.x,
                  e.clientY - offset.y ];
        },
        _getSelection: function (e) {
            e.preventDefault();
            // determine and return index list item under coordinates
            var yPos = this._getCoords(e)[1],
                itemHeight = this.indexWidgetNode.offsetHeight / this.indexList.length,
                index = Math.floor(yPos / itemHeight);
            if (this.indexList[index] != this.selection) {
                this.selection = this.indexList[index];
                // provide feedback (update tooltip/popup content)
                this.showTip(yPos);
            }
        },
        _touchDown: function (e) {
            this.isPenDown = true;
            this.selection = null;
            this._getSelection(e);
            // FIX: need to prevent scrolling of container

        },
        _touchMove: function (e) {
            if (!this.isPenDown) { return; }
            this._getSelection(e);
        },
        _touchUp: function (e) {
            e.preventDefault();
            this.isPenDown = false;

            // hide tooltip
            domClass.add(this.tooltipNode, 'hidden');

			// if we know which letter had focus up to touchUp
			// navigate/search for it
            console.log('-- Final selection: ', this.selection);

            // FIX: restore scrolling of container if disabled

            // go on to perform action/search
            this.onQuery(this.selection.key);
        },
        showTip: function(yPos) {
            this.tooltipNode.innerHTML = this.selection.tooltip || this.selection.value || this.selection.key;
            this.tooltipNode.style.top = (yPos - this.tooltipNode.offsetHeight / 2) + 'px';
            this.tooltipNode.style.right = this.indexWidgetNode.offsetWidth + 'px';
            domClass.remove(this.tooltipNode, 'hidden');
        }
    });
});
