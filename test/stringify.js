"use strict";

var assert = require ("assert");
var properties = require ("../lib");

var EOL = process.platform === "win32" ? "\r\n" : "\n";

var tests = {
	"comments multiline": function (done){
		var options = { header: "a\nb\r\nc\n" };
		var data = properties.stringify ({}, options);
		var expected = "#a" + EOL + "#b" + EOL + "#c" + EOL + "#" + EOL + EOL;
		assert.strictEqual (data, expected);
		
		done ();
	},
	"comments whitespace, escape and unicode": function (done){
		var options = { header: "   a\t↓   ", unicode: true };
		var data = properties.stringify ({}, options);
		var expected = "#   a\t\\u2193   " + EOL + EOL;
		assert.strictEqual (data, expected);
		
		done ();
	},
	"comments pretty": function (done){
		//Smaller length
		var options = { pretty: true, columns: 10,
			header: "abc   "
		};
		var data = properties.stringify ({}, options);
		var expected = "#abc   " + EOL + EOL;
		assert.strictEqual (data, expected);
		
		//Same length
		options = { pretty: true, columns: 10,
			header: "abc defgh"
		};
		data = properties.stringify ({}, options);
		expected = "#abc defgh" + EOL + EOL;
		assert.strictEqual (data, expected);
		
		//Bigger length, limit inside word
		options = { pretty: true, columns: 10,
			header: "abc defghqwe"
		};
		data = properties.stringify ({}, options);
		expected = "#abc" + EOL + "#defghqwe" + EOL + EOL;
		assert.strictEqual (data, expected);
		
		//Bigger length, limit inside whitespace
		options = { pretty: true, columns: 10,
			header: "abc defgh    \tqwe qwe\n"
		};
		data = properties.stringify ({}, options);
		expected = "#abc defgh" + EOL + "#qwe qwe" + EOL + "#" + EOL + EOL;
		assert.strictEqual (data, expected);
		
		//More than one char as a comment token
		options = { pretty: true, columns: 10, comment: "# ",
			header: "abc defgh    \tqwe qweop\n"
		};
		data = properties.stringify ({}, options);
		expected = "# abc" + EOL + "# defgh" + EOL + "# qwe" + EOL + "# qweop" +
				EOL + "# " + EOL + EOL;
		assert.strictEqual (data, expected);
		
		//Unicode comment token, word bigger than a line with trailing whitespaces
		options = { pretty: true, columns: 10, unicode: true, comment: "↑",
			header: "abc defgh        "
		};
		data = properties.stringify ({}, options);
		expected = "\\u2191abc" + EOL + "\\u2191defgh" + EOL + EOL
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