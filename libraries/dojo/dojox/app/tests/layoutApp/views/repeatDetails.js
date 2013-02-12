define(["dojo/dom", "dojo/_base/connect", "dijit/registry", "dojox/mvc/at", "dojox/mvc/getStateful", "dojox/mvc/Output"],
function(dom, connect, registry, at, getStateful, Output){
	var _connectResults = []; // events connect result

	var repeatmodel = null;	//repeat view data model

	// show an item detail
	var setDetailsContext = function(index){
		// only set the cursor if it is different and valid
		if(parseInt(index) != repeatmodel.cursorIndex && parseInt(index) < repeatmodel.model.length){
			repeatmodel.set("cursorIndex", parseInt(index));
		}
	};

	// get index from dom node id
	var getIndexFromId = function(nodeId, perfix){
		var len = perfix.length;
		if(nodeId.length <= len){
			throw Error("repeate node id error.");
		}
		var index = nodeId.substring(len, nodeId.length);
		return parseInt(index);
	};

	return {
		// repeate view init
		init: function(){
			repeatmodel = this.loadedModels.repeatmodels;
		},

		beforeActivate: function(){
			// summary:
			//		view life cycle beforeActivate()
			//
			// if this.params["cursor"] is set use it to set the selected Details Context
			if(this.params["cursor"]){
				setDetailsContext(this.params["cursor"]);
			}
		}
	}
});
