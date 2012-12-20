"use strict";

var ASSERT = require ("assert");
var FS = require ("fs");
var properties = require ("../lib/properties");

var WIN = process.platform === "win32";
var EOL = WIN ? [0x0D, 0x0A] : [0x0A];
var strEOL = WIN ? "\r\n" : "\n";

describe ("properties", function (){
	describe ("config", function (){
		it ("should configure how the properties are processed", function (done){
			properties.config ({
				comment: "!",
				separator: "	"
			});
			var props = {
				k: {
					comment: "asd",
					value: 1
				}
			};
			properties.store ("file", props, function (error){
				if (error) return done (error);
				FS.readFile ("file", function (error, data){
					if (error) return done (error);
					ASSERT.equal (data, "!asd" + strEOL + "k	1" + strEOL);
					done ();
				});
			});
		});
		
		after (function (done){
			properties.config ({
				comment: "#",
				separator: "="
			});
			FS.unlink ("file", done);
		});
	});
	
	describe ("load", function (){
		it ("should load properties", function (done){
			properties.load ("in", function (error, props){
				if (error) return done (error);
					ASSERT.deepEqual (props, {
						a1: "b",
						a2: "::=b",
						a3: "b",
						trunked1: "foobar",
						trunked2: "foo",
						"form-feed": "ff",
						"f#oo": "#bar",
						"foo bar": "foo",
						bar: " bar",
						"tab\tkey": "bar",
						"a-key": "a \n value",
						"": "empty",
						empty: null,
						empty2: null,
						"聵": "聵",
						"↑": "↓",
						E_unicode: "É",
						"←": "→"
					});
					done ();
			});
		});
		
		it ("should load empty files", function (done){
			FS.writeFile ("file", "#comment", function (error){
				if (error) return console.log (error);
				properties.load ("file", function (error, p){
					if (error) return console.log (error);
					ASSERT.equal (Object.keys (p).length, 0);
					done ();
				});
			});
		});
		
		after (function (done){
			FS.unlink ("file", done);
		});
	});

	describe ("store", function (){
		it ("should write multi-line comments", function (done){
			var header = "\nline 1\nline 2\r\nline 3\r\n";
			properties.store ("file", {}, { header: header }, function (error){
						if (error) return done (error);
						FS.readFile ("file", function (error, data){
							if (error) return done (error);
							ASSERT.equal (data.toString (),
									"#" + strEOL + "#line 1" + strEOL + "#line 2" + strEOL +
									"#line 3" +	strEOL + "#" + strEOL + strEOL);
							done ();
						});
					});
		});
		
		it ("should store properties", function (done){
			properties.config ({ separator: "\f" });
			properties.store ("file", { k: 1 }, function (error){
				if (error) return done (error);
				FS.readFile ("file", function (error, data){
					if (error) return done (error);
					ASSERT.equal (data, "k\f1" + strEOL);
					properties.config ({separator: "="});
					done ();
				});
			});
		});
		
		it ("should create a blank file if no properties are stored (no header)",
				function (done){
					properties.store ("file", {}, function (error){
						if (error) return done (error);
						FS.readFile ("file", function (error, data){
							if (error) return done (error);
							ASSERT.equal (data.length, 0);
							done ();
						});
					});
				});
		
		it ("should escape special characters ( \\t\\n\\r\\f=:#!\)",
				function (done){
					var k = " =:#!\\	\r\n\f";
					var props = {};
					props[k] = k;
					properties.store ("file", props, function (error){
						if (error) return done (error);
						FS.readFile ("file", function (error, data){
							if (error) return done (error);
							var bin =
									[0x5C, 0x20, 0x5C, 0x3D, 0x5C, 0x3A, 0x5C, 0x23, 0x5C, 0x21,
									0x5C, 0x5C, 0x5C, 0x74, 0x5C, 0x72, 0x5C, 0x6E, 0x5C, 0x66,
									0x3D, 0x5C, 0x20, 0x5C, 0x3D, 0x5C, 0x3A, 0x5C, 0x23, 0x5C,
									0x21, 0x5C, 0x5C, 0x5C, 0x74, 0x5C, 0x72, 0x5C, 0x6E, 0x5C,
									0x66];
							bin = bin.concat (EOL);
											
							ASSERT.equal (data.toString ("hex"), new Buffer (bin)
									.toString ("hex"));
							done ();
						});
					});
				});
		
		it ("should convert to unicode string representation non printable " +
				"unicode characters (C0 and C1 control codes) regardless the " +
				"encoding", function (done){
					var bin = [];
					var s = "";
					for (var i=0; i<32; i++){
						if (i === 9 || i === 10 || i === 12 || i === 13) continue;
						bin.push (String.fromCharCode (i));
						if (i < 16){
							s += "\\u000" + i.toString (16);
						}else{
							s += "\\u00" + i.toString (16);
						}
					}
					for (var i=127; i<160; i++){
						bin.push (String.fromCharCode (i));
						s += "\\u00" + i.toString (16);
					}
					var k = bin.join ("");
					var props = {};
					props[k] = k;
					properties.store ("file", props, function (error){
						if (error) return done (error);
						FS.readFile ("file", function (error, data){
							if (error) return done (error);			
							ASSERT.equal (data.toString (), s + "=" + s + strEOL);
							done ();
						});
					});
				});
		
		it ("should convert to unicode string representation characters with " +
				"code greater than 127 if is ascii encoding", function (done){
					var bin = [String.fromCharCode (128)];
					var s = "\\u0080";
					var k = bin.join ("");
					var props = {};
					props[k] = k;
					properties.store ("file", props, { encoding: "ascii" },
							function (error){
								if (error) return done (error);
								FS.readFile ("file", function (error, data){
									if (error) return done (error);			
									ASSERT.equal (data.toString (), s + "=" + s + strEOL);
									done ();
								});
							});
				});
		
		it ("should convert to unicode string representation characters with " +
				"code greater than 127 if is not ascii encoding", function (done){
					var props = {
						"Ç": "聵"
					};
					properties.store ("file", props, function (error){
						if (error) return done (error);
						FS.readFile ("file", function (error, data){
							if (error) return done (error);			
							ASSERT.equal (data.toString (), "Ç=聵" + strEOL);
							done ();
						});
					});
				});
		
		it ("should consider empty keys", function (done){
			var props = {
				a: null
			};
			properties.store ("file", props, function (error){
				if (error) return done (error);
				FS.readFile ("file", function (error, data){
					if (error) return done (error);			
					ASSERT.equal (data.toString (), "a=" + strEOL);
					done ();
				});
			});
		});
		
		afterEach (function (done){
			FS.unlink ("file", done);
		});
	});
});