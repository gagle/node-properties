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
				"[a]": null
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
	},
	"custom separator and comment tokens": function (done){
		var settings = { comments: ";", separators: "→", data: true };
		properties.parse (";a\n!a\na1:b\na2→b", settings, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a1: "b",
				a2: "b"
			});
			
			done ();
		});
	},
	"sections": function (done){
		properties.parse ("sections", { sections: true }, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a: 1,
				s1: {
					a: 1
				},
				s2: {
					a: 1
				},
				s3: {},
				"a=1": {
					"b[": "a]c"
				},
				"": {
					a: 1
				},
				"a\\t\ta→聵": {
					a: 1
				}
			});
			
			done ();
		});
	},
	"reviver with sections": function (done){
		var reviver = function (key, value, section){
			if (reviver.isSection) return section !== "a=1";
			return value;
		};
		
		properties.parse ("sections", { sections: true, reviver: reviver },
				function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a: 1,
				s1: {
					a: 1
				},
				s2: {
					a: 1
				},
				s3: {},
				"": {
					a: 1
				},
				"a\\t\ta→聵": {
					a: 1
				}
			});
			
			done ();
		});
	},
	"variables": function (done){
		var settings = { variables: true, json: false };
		properties.parse ("variables", settings, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a: null,
				"": "c",
				get: "s",
				"s1|temp": "d",
				b: "d",
				_c_d_: "e",
				r: "{{{|}}end$}}{{|"
			});
			
			done ();
		});
	},
	"variables with sections": function (done){
		var settings = { variables: true, sections: true, json: false };
		properties.parse ("variables-sections", settings, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a: "1",
				t: {
					get: "s"
				},
				s1: {
					e2: "ee",
					greet: "say hi",
					a: "am",
					b: "{say hi}, {name}!"
				},
				s2: {
					a: "12",
					"12": "34"
				},
				"": {
					"1_a_12_34": "12 months",
					obvious: "1 year = 12 months",
					"123": "456",
					"456": "123"
				}
			});
			
			done ();
		});
	},
	"variables with json": function (done){
		var settings = { variables: true, sections: true };
		properties.parse ("variables-json", settings, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				Me: {
					what: "mail",
					name: "me",
					email: "me@me.com",
					user: {
						num: 1,
						friends: ["me"],
						name: "me",
						email: "me@me.com"
					}
				}
			});
			
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