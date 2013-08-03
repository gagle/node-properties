"use strict";

var util = require ("util");
var properties = require ("../../lib");

var options = {
	path: true,
	sections: true,
	reviver: function (key, value, section){
		if (this.isSection){
			var holder = p;
			section.split (".").forEach (function (o){
				if (!(o in holder)){
					holder[o] = {};
				}
				holder = holder[o];
			});
		}else{
			var holder = p;
			if (section){
				section.split (".").forEach (function (o){
					holder = holder[o];
				});
			}
			holder[key] = value;
		}
		
		return this.assert ();
	}
};

var p = {};

properties.parse ("namespaces", options, function (error){
	if (error) return console.error (error);
	
	console.log (util.inspect (p, { depth: null }));
	
	/*
	{
		level: 0,
		a: {
			level: 1,
			b: {
				level: 2,
				c: {
					level: 3
				}
			}
		}
	}
	*/
});