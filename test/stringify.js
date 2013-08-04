//"use strict";

var assert = require ("assert");
var properties = require ("../lib");
var fs = require ("fs");

var WIN = process.platform === "win32";
var EOL = WIN ? "\r\n" : "\n";

var tests = {
	"comments multiline": function (done){
		var stringifier = properties.stringifier ().header ("a\nb\r\nc\n");
		var data = properties.stringify (stringifier);
		var expected = "# a" + EOL + "# b" + EOL + "# c" + EOL + "# " + EOL + EOL;
		assert.strictEqual (data, expected);
		
		done ();
	},
	"comments whitespace, escape and unicode": function (done){
		var options = { unicode: true };
		var stringifier = properties.stringifier ().header ("   a\t↓   ");
		var data = properties.stringify (stringifier, options);
		var expected = "#    a\t\\u2193   " + EOL + EOL;
		assert.strictEqual (data, expected);
		
		done ();
	},
	"key and value whitespace, escape and unicode": function (done){
		var options = { unicode: true };
		var stringifier = properties.stringifier ()
				.property ({ comment: "asd", key: "   a\t↓   ", value: "   a\t↓   " });
		var data = properties.stringify (stringifier, options);
		var expected = "# asd" + EOL + "\\ \\ \\ a\\t\\u2193\\ \\ \\  = \\ \\ " +
				"\\ a\\t\\u2193   ";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"custom comment and separator": function (done){
		var options = { comment: ";", separator: "-" };
		var stringifier = properties.stringifier ()
				.property ({ comment: "asd", key: "a", value: "b" });
		var data = properties.stringify (stringifier, options);
		var expected = "; asd" + EOL + "a - b";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"no key": function (done){
		var stringifier = properties.stringifier ()
				.property ({ value: "b" });
		var data = properties.stringify (stringifier);
		var expected = " = b";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"no value": function (done){
		var stringifier = properties.stringifier ()
				.property ({ key: "a" });
		var data = properties.stringify (stringifier);
		var expected = "a = ";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"no key and no value": function (done){
		var stringifier = properties.stringifier ()
				.property ({});
		var data = properties.stringify (stringifier);
		var expected = " = ";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"section, whitespace, escape and unicode": function (done){
		var options = { unicode: true };
		var stringifier = properties.stringifier ()
				.section ({ name: "   a\t↓   " });
		var data = properties.stringify (stringifier, options);
		var expected = "[   a\\t\\u2193   ]";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"empty section": function (done){
		var stringifier = properties.stringifier ()
				.section ({});
		var data = properties.stringify (stringifier);
		var expected = "[]";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"stringifier": function (done){
		var stringifier = properties.stringifier ()
				.header ("a\nb\n")
				.property ({ key: "a", value: "a value" })
				.property ({ key: "b" })
				.property ({ comment: "c comment", key: "c", value: "c value" })
				.property ({ comment: "d comment", key: "d" })
				.section ({})
				.section ({ comment: "h section", name: "h" })
				.property ({ key: "a", value: "a value" })
				.property ({ comment: "b comment", key: "b", value: "b value" });
		var data = properties.stringify (stringifier);
		var expected = "# a" + EOL + "# b" + EOL + "# " + EOL + EOL +
				"a = a value" + EOL + "b = " + EOL + "# c comment" + EOL +
				"c = c value" + EOL + "# d comment" + EOL + "d = " + EOL + EOL + "[]" +
				EOL + EOL + "# h section" + EOL + "[h]" + EOL + "a = a value" + EOL +
				"# b comment" + EOL + "b = b value";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"stringifier converter": function (done){
		var o = {
			a: 1,
			b: [1, 2],
			"1": 1
		};
		
		var data = properties.stringify (o);
		var expected = "1 = 1" + EOL + "a = 1" + EOL + "b = [1,2]";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"replacer": function (done){
		var stringifier = properties.stringifier ()
				.property ({ key: "a", value: "a value" })
				.section ("a")
				.property ({ key: "a", value: "a value" })
				.section ("b")
				.property ({ key: "a", value: "a value" });
		var options = {
			replacer: function (key, value, section){
				if (this.isSection && section === "b") return;
				if (this.isProperty && !section && key === "a") return "A VALUE";
				return this.assert ();
			}
		};
		var data = properties.stringify (stringifier, options);
		var expected = "a = A VALUE" + EOL + EOL + "[a]" + EOL + "a = a value";
		assert.strictEqual (data, expected);
		
		done ();
	},
	"arrays and objects": function (done){
		var stringifier = properties.stringifier ()
				.property ({ key: "a", value: [1, 2] })
				.property ({ key: "b", value: { a: 1 } });
		var data = properties.stringify (stringifier);
		var expected = "a = [1,2]" + EOL + "b = {\"a\":1}";
		assert.strictEqual (data, expected);
		
		done ();
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