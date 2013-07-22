"use strict";

var assert = require ("assert");
var properties = require ("../lib");

var tests = {
	"load properties": function (done){
		properties.parse ("properties", function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a1: "b",
				a2: "b",
				a3: "b",
				a4: "b",
				a5: "b",
				"": "b",
				a6: null,
				a7: null,
				a8: null,
				a9: "b",
				a10: "b",
				a11: "b",
				a12: "b",
				a13: null,
				a14: "b",
				a15: "b",
				"a16=": "=b",
				"\\": "\\\\  ",
				"a\\n\\\\17": "\\n\\\\b",
				a18: "b\n\t",
				" ": " ",
				"\n": "\n",
				"聵": "聵",
				"↑": "↓",
				a19: "É",
				"←": "→",
				a20: true,
				a21: false,
				a22: 123,
				a23: [1, 2, 3],
				a24: { "1": { "2": 3 }},
			});
			
			done ();
		});
	},
	"load properties (empty key, empty value)": function (done){
		properties.parse (":", { data: true }, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				"": null
			});
			
			done ();
		});
	},
	"load properties (no json)": function (done){
		properties.parse ("a1 true\na2 false\na3 123\na4 [1, 2, \\\n		" +
				"3]\na5 : { \"1\"\\\n		: { \"2\": 3 }}", { data: true, json: false },
				function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a1: true,
				a2: false,
				a3: 123,
				a4: "[1, 2, 3]",
				a5: "{ \"1\": { \"2\": 3 }}",
			});
			
			done ();
		});
	},
	"reviver": function (done){
		var reviver = function (key, value){
			if (key === "a") return 1;
		};
		
		properties.parse ("a b\nc d", { data: true, reviver: reviver },
				function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a: 1
			});
			
			done ();
		});
	},
	"empty data": function (done){
		properties.parse ("", { data: true }, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {});
			
			done ();
		});
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