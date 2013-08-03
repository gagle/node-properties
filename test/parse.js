"use strict";

var assert = require ("assert");
var properties = require ("../lib");

var tests = {
	"parse": function (done){
		var options = { path: true, json: true };
		
		properties.parse ("properties", options, function (error, p){
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
				"a121   ": "b",
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
				"→": "→",
				a20: true,
				a21: false,
				a22: 123,
				a23: [1, 2, 3],
				a24: { "1": { "2": 3 }},
				"[a]": null,
				a25: null
			});
			
			done ();
		});
	},
	"parse (no key, no value)": function (done){
		properties.parse (":", function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				"": null
			});
			
			done ();
		});
	},
	"parse (no json)": function (done){
		properties.parse ("a1 true\na2 false\na3 123\na4 [1, 2, \\\n		" +
				"3]\na5 : { \"1\"\\\n		: { \"2\": 3 }}", function (error, p){
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
		var options = {
			reviver: function (key, value){
				if (key === "a") return "b";
				if (key === "b") return;
				return this.assert ();
			}
		};
		
		properties.parse ("a 1\nb 1\nc 1", options, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a: "b",
				c: 1
			});
			
			done ();
		});
	},
	"empty data": function (done){
		properties.parse ("", function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {});
			
			done ();
		});
	},
	"custom separator and comment tokens": function (done){
		var options = { comments: ";", separators: "-" };
		
		properties.parse (";a\n!a\na1:b\na2-b", options, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				a1: "b",
				a2: "b"
			});
			
			done ();
		});
	},
	"sections": function (done){
		var options = { sections: true, path: true };
		
		properties.parse ("sections", options, function (error, p){
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
	"sections random": function (done){
		var data = "#a\n#b\n#\n\na=a value\nb=\n#c comment\nc=c value\n#d comment" +
				"\nd=\n[]\n#h section\n[h]\na=a value\n#b comment\nb=b value";
		var p = properties.parse (data, { sections: true });
		
		assert.deepEqual (p, {
			a: "a value",
			b: null,
			c: "c value",
			d: null,
			"": {},
			h: {
				a: "a value",
				b: "b value"
			}
		});
		
		done ();
	},
	"reviver with sections": function (done){
		var reviver = function (key, value, section){
			if (this.isSection) return section !== "a=1";
			return value;
		};
		var options = { sections: true, reviver: reviver, path: true };
		
		properties.parse ("sections", options, function (error, p){
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
		var options = { variables: true, json: false, path: true };
		
		properties.parse ("variables", options, function (error, p){
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
		var options = { variables: true, sections: true, json: false, path: true };
		
		properties.parse ("variables-sections", options, function (error, p){
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
		var options = { variables: true, sections: true, path: true, json: true };
		
		properties.parse ("variables-json", options, function (error, p){
			assert.ifError (error);
			
			assert.deepEqual (p, {
				profile: {
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