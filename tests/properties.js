"use strict";

var ASSERT = require ("assert");
var FS = require ("fs");
var properties = require ("../lib/properties");

var WIN = process.platform === "win32";
var EOL = WIN ? [0x0D, 0x0A] : [0x0A];
var strEOL = WIN ? "\r\n" : "\n";

describe ("properties", function (){
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
						"": null,
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
		
		it ("can use a reviver", function (done){
			var reviver = function (key, value){
				if (key === "聵") return value;
			};
			properties.load ("in", { reviver: reviver }, function (error, props){
				if (error) return done (error);
					ASSERT.deepEqual (props, {
						"聵": "聵"
					});
					done ();
			});
		});
		
		it ("can read sections", function (done){
			properties.load ("sections", { sections: true }, function (error, data){
				if (error) return done (error);
				ASSERT.deepEqual (data, {
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
					}
				});
				done ();
			});
		});
		
		it ("can parse properties defined like sections when the sections are " +
				"disabled", function (done){
			ASSERT.deepEqual (properties.parse ("[s 1]"), { "[s": "1]" });
			ASSERT.deepEqual (properties.parse ("[a]"),	{ "[a]": null });
			done ();
		});
		
		it ("can apply a reviver to the sections", function (done){
			var reviver = function (key, value, section){
				if (key === null){
					return section === "s1" ? section : undefined;
				}
				return value;
			};
			
			properties.load ("sections", { reviver: reviver, sections: true },
					function (error, data){
						if (error) return done (error);
						ASSERT.deepEqual (data, {
							a: 1,
							s1: {
								a: 1
							}
						});
						done ();
					});
		});
		
		it ("can substitute variables, no sections", function (done){
			properties.load ("expansion_no_sections", { variables: true },
					function (error, props){
				if (error) return done (error);
				ASSERT.deepEqual (props, {
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
		});
		
		it ("can substitute variables, sections", function (done){
			properties.load ("expansion_sections", {
				variables: true,
				sections: true
			}, function (error, props){
				if (error) return done (error);
				ASSERT.deepEqual (props, {
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
		});
		
		it ("should return error when the variable is malformed",
				function (done){
					try{
						properties.parse ("a=1\nb=${${a}", { variables: true });
						ASSERT.fail ();
					}catch (e){
						ASSERT.equal (e.code, "MALFORMED_VARIABLE");
						ASSERT.equal (e.string, "${${a}");
					}
					done ();
				});
		
		it ("should return error when the section is not found",
				function (done){
					try{
						properties.parse ("b=${s1|a}", { variables: true,
								sections: true });
						ASSERT.fail ();
					}catch (e){
						ASSERT.equal (e.code, "SECTION_VARIABLE_NOT_FOUND");
						ASSERT.equal (e.section ,"s1");
					}
					done ();
				});
		
		it ("should configure how the properties are processed", function (done){
			var props = {
				k: {
					$comment: "asd",
					$value: 1
				}
			};
			properties.store ("file", props, {
				comment: "!",
				separator: "	"
			}, function (error){
				if (error) return done (error);
				FS.readFile ("file", "utf8", function (error, data){
					if (error) return done (error);
					ASSERT.equal (data, "!asd" + strEOL + "k	1" + strEOL);
					done ();
				});
			});
		});
		
		it ("can parse .ini files changing the allowed tokens",
				function (done){
					properties.load ("ini", {
						comments: [";"],
						sections: true
					}, function (error, props){
						if (error) return done (error);
						ASSERT.deepEqual (props, {
							a: 1,
							section1: {
								a: 1
							}
						});
						done ();
					});
				});
				
		it ("can stringify .ini files changing the allowed tokens",
				function (done){
					var props = {
						a: {
							$comment: "a",
							$value: {
								a: 1
							}
						}
					};
					ASSERT.equal (properties.stringify (props, {
						comment: ";",
						sections: true
					}).replace (/\r/g, ""), ";a\n[a]\na=1\n");
					done ();
				});
		
		it ("can change the comment and separator allowed tokens", function (done){
			var props = {
				a: {
					$comment: "a",
					$value: 1
				}
			};
			ASSERT.equal (properties.stringify (props, {
				comment: "?",
				comments: [".", "?"],
				separator: "-",
				separators: ["-"]
			}).replace (/\r/g, ""), "?a\na-1\n");
			props = {
				a: 1,
				b: 2
			};
			ASSERT.deepEqual (properties.parse (".a\n?b\n#c\na=1\nb-2", {
				comment: "?",
				comments: [".", "?"],
				separator: "-",
				separators: ["-"]
			}), props);
			done ();
		});
		
		after (function (done){
			FS.exists ("file", function (exists){
				if (exists){
					FS.unlink ("file", done);
				}else{
					done ();
				}
			});
		});
	});
	
	describe ("parse", function (){
		it ("should parse stringified properties", function (done){
			FS.readFile ("in", "utf8", function (error, data){
				if (error) return done (error);
				var props = properties.parse (data);
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
					"": null,
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
		
		it ("should parse empty strings", function (done){
			ASSERT.equal (Object.keys (properties.parse ("")).length, 0);
			done ();
		});
		
		it ("can use a reviver", function (done){
			var reviver = function (key, value){
				if (key === "聵") return value;
			};
			
			FS.readFile ("in", "utf8", function (error, data){
				if (error) return done (error);
				var props = properties.parse (data, { reviver: reviver });
				ASSERT.deepEqual (props, {
						"聵": "聵"
					});
					done ();
			});
		});
	});

	describe ("store", function (){
		it ("should write multi-line comments", function (done){
			var header = "\nline 1\nline 2\r\nline 3\r\n";
			properties.store ("file", {}, { header: header }, function (error){
						if (error) return done (error);
						FS.readFile ("file", "utf8", function (error, data){
							if (error) return done (error);
							ASSERT.equal (data,
									"#" + strEOL + "#line 1" + strEOL + "#line 2" + strEOL +
									"#line 3" +	strEOL + "#" + strEOL + strEOL);
							done ();
						});
					});
		});
		
		it ("should store sections and properties with and without metadata",
				function (done){
			var props = {
				a: "a value",
				b: null,
				c: {
					$comment: "c comment",
					$value: "c value"
				},
				d: {
					$comment: "d comment",
					$value: null
				},
				e: {
					$comment: "e comment"
				},
				f: {
					$value: "f value"
				},
				g: {},
				h: {
					$comment: "h section",
					$value: {
						a: 1,
						b: {
							$comment: "b comment",
							$value: 2
						},
						c: {
							z: 1
						}
					}
				},
				i: {
					a: 1,
					b: 2
				},
				"": {
					a: 1
				}
			};
			properties.store ("file", props, { sections: true }, function (error){
				if (error) return done (error);
				FS.readFile ("file", "utf8", function (error, data){
					if (error) return done (error);
					var content = "a=a value\nb=\n#c comment\nc=c value\n#d comment\n" +
							"d=\n#e comment\ne=\nf=f value\n[g]\n#h section\n[h]\na=1\n" +
							"#b comment\nb=2\nc=[object Object]\n[i]\na=1\nb=2\n[]\na=1\n";
					ASSERT.equal (data.replace (/\r/g, ""), content);
					done ();
				});
			});
		});
		
		it ("should store properties with and without metadata when sections " +
				"are disabled", function (done){
					var props = {
						a: "a value",
						b: null,
						c: {
							$comment: "c comment",
							$value: "c value"
						},
						d: {
							$comment: "d comment",
							$value: null
						},
						e: {
							$comment: "e comment"
						},
						f: {
							$value: "f value"
						},
						g: {},
						h: {
							$comment: "h section",
							$value: {
								a: 1,
								b: {
									$comment: "b comment",
									$value: 2
								},
								c: {
									z: 1
								}
							}
						},
						i: {
							a: 1,
							b: 2
						},
						"": {
							a: 1
						}
					};
					properties.store ("file", props, function (error){
						if (error) return done (error);
						FS.readFile ("file", "utf8", function (error, data){
							if (error) return done (error);
							var content = "a=a value\nb=\n#c comment\nc=c value\n" +
									"#d comment\nd=\n#e comment\ne=\nf=f value\ng=\n" +
									"#h section\nh=[object Object]\ni=[object Object]\n" +
									"=[object Object]\n";
							ASSERT.equal (data.replace (/\r/g, ""), content);
							done ();
						});
					});
				});
		
		it ("can use a replacer, function", function (done){
			var replacer = function (key, value){
				if (key === "a") return value;
			};
			properties.store ("file", { a: 1, b: 2 }, { replacer: replacer },
					function (error){
						if (error) return done (error);
						FS.readFile ("file", "utf8", function (error, data){
							if (error) return done (error);
							ASSERT.equal (data, "a=1" + strEOL);
							done ();
						});
					});
		});
		
		it ("can use a replacer, array", function (done){
			properties.store ("file", { a: 1, b: 2 }, { replacer: ["a"] },
					function (error){
						if (error) return done (error);
						FS.readFile ("file", "utf8", function (error, data){
							if (error) return done (error);
							ASSERT.equal (data, "a=1" + strEOL);
							done ();
						});
					});
		});
		
		it ("can use a replacer with sections enabled, function", function (done){
			var replacer = function (key, value, section){
				if (key === null){
					return section !== "a" ? section : undefined;
				}
				return value;
			};
			var props = {
				a: {
					b: 1,
					c: 2
				},
				b: 1,
				c: {}
			};
			properties.store ("file", props, { replacer: replacer, sections: true },
					function (error){
						if (error) return done (error);
						FS.readFile ("file", "utf8", function (error, data){
							if (error) return done (error);
							ASSERT.equal (data.replace (/\r/g, ""), "b=1\n[c]\n");
							done ();
						});
					});
		});
		
		it ("can use a replacer with sections enabled, array", function (done){
			var props = {
				a: {
					b: 1,
					c: 2
				},
				b: 1,
				c: {}
			};
			properties.store ("file", props, { replacer: ["b", "c"],
					sections: true }, function (error){
						if (error) return done (error);
						FS.readFile ("file", "utf8", function (error, data){
							if (error) return done (error);
							ASSERT.equal (data.replace (/\r/g, ""), "b=1\n[c]\n");
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
						FS.readFile ("file", "utf8", function (error, data){
							if (error) return done (error);			
							ASSERT.equal (data, s + "=" + s + strEOL);
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
								FS.readFile ("file", "utf8", function (error, data){
									if (error) return done (error);			
									ASSERT.equal (data, s + "=" + s + strEOL);
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
						FS.readFile ("file", "utf8", function (error, data){
							if (error) return done (error);			
							ASSERT.equal (data, "Ç=聵" + strEOL);
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
				FS.readFile ("file", "utf8", function (error, data){
					if (error) return done (error);			
					ASSERT.equal (data, "a=" + strEOL);
					done ();
				});
			});
		});
		
		it ("should obtain the same properties when parsing a stringified " +
				"properties, sections enabled",
				function (done){
			var props = {
				a: 1,
				b: null,
				c: {},
				d: {
					e: 1,
					f: 1,
					g: null
				}
			};
			ASSERT.deepEqual (properties.parse (properties.stringify (props,
					{ sections: true }), { sections: true }), props);
			done ();
		});
		
		it ("should pretty print the properties", function (done){
			var props = {
				abc: {
					$comment: "aaaaaaa bbbbbb cccccc dddddd eeeeee ffffff gggggg hhhhh" +
							"h iiiiii jjjjjj kkkkkk llllllll mmmmmm nnnnnn oooooo pppppp q" +
							"qqqqq rrrrrr ssssss tttttt uuuuuu vvvvvv wwwwww xxxxxx yyyyyy" +
							" zzzzzz",
					$value: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
							"aaaaaaaaaaaaaaaaaaa"
				},
				another_abc: {
					$comment: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" +
							"bbbbbbbbbbbbbbbbbbbbbb",
					$value: "aaaaaa bbbbbb cccccc dddddd eeeeee ffffff gggggg hhhhhh i" +
							"iiiii jjjjjj kkkkkk llllll mmmmmm nnnnnn oooooo pppppp qqqqqq" +
							" rrrrrr ssssss  tttttt uuuuuu vvvvvv wwwwww xxxxxx yyyyyy zzz" +
							"zzz",
				}
			};

			var header = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa bbb" +
					"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbcccccccccccccc" +
					"cccccccccccccccccccccccccccc\nddddddddddddddddddddddddddddddddddd" +
					"ddddddddddddddddddddddddddddddddddddddddddddddddddd\neee";

			properties.store ("file", props, { header: header, pretty: true },
					function (error){
						if (error) return done (error);
						
						var str = "# aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
								"a\n# bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" +
								"cccccccccccccccccccccccccccccccccccccccccc\n# ddddddddddddd" +
								"ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd" +
								"dddddddddddddd\n# eee\n\n# aaaaaaa bbbbbb cccccc dddddd eee" +
								"eee ffffff gggggg hhhhhh iiiiii jjjjjj kkkkkk\n# llllllll m" +
								"mmmmm nnnnnn oooooo pppppp qqqqqq rrrrrr ssssss tttttt uuuu" +
								"uu\n# vvvvvv wwwwww xxxxxx yyyyyy zzzzzz\nabc         = aaa" +
								"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
								"aa\\\n              aaaaaaaaaaaa\n\n# bbbbbbbbbbbbbbbbbbbbb" +
								"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\na" +
								"nother_abc = aaaaaa bbbbbb cccccc dddddd eeeeee ffffff gggg" +
								"gg hhhhhh iiiiii j\\\n              jjjjj kkkkkk llllll mmm" +
								"mmm nnnnnn oooooo pppppp qqqqqq rrrrrr ss\\\n              " +
								"ssss  tttttt uuuuuu vvvvvv wwwwww xxxxxx yyyyyy zzzzzz\n";
								
						FS.readFile ("file", "utf8", function (error, data){
							if (error) return done (error);
							
							ASSERT.equal (data.replace (/\r/g, ""), str);
							done ();
						});
					});
		});
		
		afterEach (function (done){
			FS.exists ("file", function (exists){
				if (exists){
					FS.unlink ("file", done);
				}else{
					done ();
				}
			});
		});
	});
	
	describe ("stringify", function (){
		//Specific tests are tested in the store() function
		
		it ("should stringify properties", function (done){
			var props = {
				a: 1,
				b: 2
			};
			ASSERT.equal (properties.stringify (props), "a=1" + strEOL + "b=2" +
					strEOL);
			done ();
		});
		
		it ("should return an empty string if the object doesn't contain " +
				"properties", function (done){
					ASSERT.equal (properties.stringify ({}), "");
					done ();
				});
	});
});