//"use strict";

var assert = require ("assert");
var properties = require ("../lib");
var fs = require ("fs");
var path = require ("path");

//Avoid using __dirname all the time and to allow includes from a string
process.chdir (path.dirname (process.mainModule.filename));

var WIN = process.platform === "win32";
var EOL = WIN ? "\r\n" : "\n";

var tests = {
	"iso-8859-1": function (){
		var options = { unicode: true };
		var data = properties.stringify ({ "¡": "ÿ", "Ā": "a" }, options);
		var expected = "¡ = ÿ" + EOL + "\\u0100 = a";
		assert.strictEqual (data, expected);
	},
	"comments multiline": function (){
		var stringifier = properties.createStringifier ().header ("a\nb\r\nc\n");
		var data = properties.stringify (stringifier);
		var expected = "# a" + EOL + "# b" + EOL + "# c" + EOL + "# " + EOL + EOL;
		assert.strictEqual (data, expected);
	},
	"comments whitespace, escape and unicode": function (){
		var options = { unicode: true };
		var stringifier = properties.createStringifier ().header ("   a\t↓   ");
		var data = properties.stringify (stringifier, options);
		var expected = "#    a\t\\u2193   " + EOL + EOL;
		assert.strictEqual (data, expected);
	},
	"key and value whitespace, escape and unicode": function (){
		var options = { unicode: true };
		var stringifier = properties.createStringifier ()
				.property ({ comment: "asd", key: "   a\t↓   ", value: "   a\t↓   " });
		var data = properties.stringify (stringifier, options);
		var expected = "# asd" + EOL + "\\ \\ \\ a\\t\\u2193\\ \\ \\  = \\ \\ " +
				"\\ a\\t\\u2193   ";
		assert.strictEqual (data, expected);
	},
	"custom comment and separator": function (){
		var options = { comment: ";", separator: "-" };
		var stringifier = properties.createStringifier ()
				.property ({ comment: "asd", key: "a", value: "b" });
		var data = properties.stringify (stringifier, options);
		var expected = "; asd" + EOL + "a - b";
		assert.strictEqual (data, expected);
	},
	"no key": function (){
		var stringifier = properties.createStringifier ()
				.property ({ value: "b" });
		var data = properties.stringify (stringifier);
		var expected = " = b";
		assert.strictEqual (data, expected);
	},
	"no value": function (){
		var stringifier = properties.createStringifier ()
				.property ({ key: "a" });
		var data = properties.stringify (stringifier);
		var expected = "a = ";
		assert.strictEqual (data, expected);
	},
	"no key and no value": function (){
		var stringifier = properties.createStringifier ()
				.property ({});
		var data = properties.stringify (stringifier);
		var expected = " = ";
		assert.strictEqual (data, expected);
	},
	"section, whitespace, escape and unicode": function (){
		var options = { unicode: true };
		var stringifier = properties.createStringifier ()
				.section ({ name: "   a\t↓   " });
		var data = properties.stringify (stringifier, options);
		var expected = "[   a\\t\\u2193   ]";
		assert.strictEqual (data, expected);
	},
	"empty section": function (){
		var stringifier = properties.createStringifier ()
				.section ({});
		var data = properties.stringify (stringifier);
		var expected = "[]";
		assert.strictEqual (data, expected);
	},
	"stringifier": function (){
		var stringifier = properties.createStringifier ()
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
	},
	"stringifier converter": function (){
		var o = {
			a: 1,
			b: [1, 2],
			"1": 1
		};
		var data = properties.stringify (o);
		var expected = "1 = 1" + EOL + "a = 1" + EOL + "b = 1,2";
		assert.strictEqual (data, expected);
	},
	"replacer": function (){
		var stringifier = properties.createStringifier ()
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
	},
	"arrays and objects": function (){
		var stringifier = properties.createStringifier ()
				.property ({ key: "a", value: [1, "a"] })
				.property ({ key: "b", value: { a: 1 } });
		var data = properties.stringify (stringifier);
		var expected = "a = 1,a" + EOL + "b = [object Object]";
		assert.strictEqual (data, expected);
	},
	"stringify object": function (){
		var o = {
			a: 1,
			b: "a",
			c: null,
			d: undefined,
			"": 2
		};
		var data = properties.stringify (o);
		var expected = "a = 1" + EOL + "b = a" + EOL + "c = " + EOL + "d = " + EOL +
				" = 2";
		assert.strictEqual (data, expected);
	}
};

for (var test in tests){
	tests[test] ();
}