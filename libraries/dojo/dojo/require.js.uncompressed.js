//>>built
define("dojo/require", ["./_base/loader"], function(loader){
	return {
		dynamic:1,
		normalize:function(id){return id;},
		load:loader.require
	};
});
