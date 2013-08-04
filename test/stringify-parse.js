"use strict";

var assert = require ("assert");
var properties = require ("../lib");

var tests = {
	"objects and arrays": function (done){
		var o = {
			a: [1, 2, 3],
			o: { a: 1, b: 2 }
		};
		var options = { json: true };
		
		var p;
		assert.doesNotThrow (function (){
			p = properties.parse (properties.stringify (o), options);
		});
		
		assert.deepEqual (p, o);
	}
};

var keys = Object.keys (tests);
var keysLength = keys.length;

(function again (i){
	if (i<keysLength){
		var fn = tests[keys[i]];
		if (fn.length){
			fn (function (){
				again (i + 1);
			});
		}else{
			fn ();
			again (i + 1);
		}
	}
})(0);