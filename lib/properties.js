"use strict";

var bw = require ("buffered-writer");
var DataReader = require ("buffered-reader").DataReader;
var ep = require ("error-provider");

var properties = module.exports = {};
var Reader = require ("./reader");
var Writer = require ("./writer");

ep.create (ep.next (), "VARIABLE_NOT_FOUND",
		"Cannot found the {key} property", { string: "{string}",
		section: "{section}" });
ep.create (ep.next (), "MALFORMED_VARIABLE",
		"Malformed variable", { string: "{string}" });
ep.create (ep.next (), "SECTION_VARIABLE_NOT_FOUND",
		"Cannot found the {section} section", { section: "{section}",
		string: "{string}" });
		
properties._config = {
	comment: {
		pretty: "# ",
		string: "#",
		allowed: {
			"#": null,
			"!": null
		}
	},
	separator: {
		pretty: " = ",
		string: "=",
		allowed: {
			"=": null,
			":": null
		}
	},
	sections: false,
	variables: false
};

properties._substitute = function  (props, str, cb){
	if (!properties._config.variables || !str) return cb (null, str);
	
	var stack = [];
	var c;
	var cp;
	var key = "";
	var section = null;
	var v;
	var holder;
	var t;
	
	for (var i=0, len=str.length; i<len; i++){
		c = str[i];
		
		if (cp === "$" && c === "{"){
			key = key.substring (0, key.length - 1);
			stack.push ({
				key: key,
				section: section
			});
			key = "";
			section = null;
			continue;
		}else if (stack.length){
			if (properties._config.sections && c === "|"){
				section = key;
				key = "";
				continue;
			}else if (c === "}"){
				holder = section !== null ? props[section] : props;
				if (!holder){
					return cb (ep.get ("SECTION_VARIABLE_NOT_FOUND", { section: section,
							string: str }), null);
				}
				if (!(key in holder)){
					return cb (ep.get ("VARIABLE_NOT_FOUND", { key: key, string: str,
							section: section }), null);
				}
				v = holder[key];
				t = stack.pop ();
				section = t.section;
				key = t.key + (v === null ? "" : v);
				continue;
			}
		}
		
		cp = c;
		key += c;
	}
	
	if (stack.length !== 0){
		return cb (ep.get ("MALFORMED_VARIABLE", { string: str }), null);
	}
	
	return cb (null, key);
};

properties.config = function (args){
	args = args || {};
	
	if ("comment" in args){
		args.comment = args.comment || "#";
		properties._config.comment.string = args.comment;
		properties._config.comment.pretty = args.comment.trim () + " ";
	}
	
	if ("separator" in args){
		args.separator = args.separator || "=";
		properties._config.separator.string = args.separator;
		properties._config.separator.pretty = " ";
		args.separator = args.separator.trim ();
		if (args.separator){
			properties._config.separator.pretty += args.separator + " ";
		}
	}
	
	if (args.allowedComments){
		args.allowedComments.unshift ("#", "!");
		properties._config.comment.allowed = {};
		for (var i=0, len=args.allowedComments.length; i<len; i++){
			properties._config.comment.allowed[args.allowedComments[i]] = null;
		}
	}
	
	if (args.allowedSeparators){
		args.allowedSeparators.unshift ("=", ":");
		properties._config.separator.allowed = {};
		for (var i=0, len=args.allowedSeparators.length; i<len; i++){
			properties._config.separator.allowed[args.allowedSeparators[i]] = null;
		}
	}
	
	if (args.sections !== null || args.sections !== undefined){
		properties._config.sections = args.sections;
	}
	
	if (args.variables !== null || args.variables !== undefined){
		properties._config.variables = args.variables;
	}
};

var convertType = function (value){
	if (value === null) return null;
	var lower = value.toLowerCase ();
	if (lower === "true") return true;
	if (lower === "false") return false;
	if (!isNaN (value)) return parseInt (value);
	return value;
};

var createHandlers = function (cb, reviver, io){
	var props = {};
	var onSection = null;
	var e = false;
	
	var substituteAndConvert = function (key, value, callback){
		properties._substitute (props, key, function (error, key){
			if (error){
				e = true;
				return cb (error, null);
			}
			properties._substitute (props, value, function (error, value){
				if (error){
					e = true;
					return cb (error, null);
				}
				callback (key, convertType (value || null));
			});
		});
	};
	
	var onKeyValue = reviver
			? function (key, value, section){
				substituteAndConvert (key, value, function (key, value){
					if (properties._config.sections){
						value = reviver (key, value, section);
					}else{
						value = reviver (key, value);
					}
					
					if (value === undefined) return;
					if (section !== null){
						props[section][key] = value;
					}else{
						props[key] = value;
					}
				});
			}
			: function (key, value, section){
				substituteAndConvert (key, value, function (key, value){
					if (section !== null){
						props[section][key] = value;
					}else{
						props[key] = value;
					}
				});
			};
	
	if (properties._config.sections){
		onSection = reviver
				? function (section){
					properties._substitute (props, section, function (error, section){
						if (error){
							e = true;
							return cb (error, null);
						}
						reader.section (section);
						section = reviver (null, null, section);
						if (section === undefined){
							reader.skipSection ();
						}else{
							props[section] = {};
						}
					});
				}
				: function (section){
					properties._substitute (props, section, function (error, section){
						if (error){
							e = true;
							return cb (error, null);
						}
						reader.section (section);
						props[section] = {};
					});
				}
	}
	
	var reader = new Reader (onKeyValue, onSection,
			io
					? function (){
						if (!e) cb (null, props);
					}
					: null
			);
	
	return {
		properties: function (){
			return props;
		},
		reader: reader
	};
};

properties.load = function (file, args, cb){
	if (arguments.length === 2){
		cb = args;
		args = {};
	}
	
	var quit = false;
	
	var handlers = createHandlers (function (error, props){
		if (error){
			quit = true;
			dr.interrupt ();
			return cb (error, null);
		}
		cb (null, props);
	}, args.reviver, true);

	var dr = new DataReader (file, {
			encoding: args.encoding || "utf8",
			bufferSize: args.bufferSize
		}).on ("error", function (error){
				cb (error, null);
			})
			.on ("character", function (c){
				handlers.reader.parse (c);
			})
			.on ("end", function (){
				if (!quit) handlers.reader.eof ();
			});
	dr.read ();
};

properties.parse = function (str, args){
	args = args || {};

	var handlers = createHandlers (function (error, props){
		if (error) throw error;
	}, args.reviver);
	
	for (var i=0, len=str.length; i<len; i++){
		handlers.reader.parse (str[i]);
	}
	
	handlers.reader.eof ();
	
	return handlers.properties ();
};

properties.store = function (file, obj, args, cb){
	if (arguments.length === 3){
		cb = args;
		args = {};
	}
	
	var out = bw.open (file, {
		encoding: args.encoding,
		bufferSize: args.bufferSize
	}).on ("error", function (error){
		cb (error);
	});
	
	var write = function (str){
		out.write (str);
	};
	
	new Writer (write, {
		header: args.header,
		replacer: args.replacer,
		pretty: args.pretty,
		unicode: args.encoding === "ascii"
	}).stringify (obj);
	
	out.close (function (){
		cb (null);
	});
};

properties.stringify = function (obj, args){
	var s = "";
	
	args = args || {};
	
	new Writer (function (str){
		s += str;
	}, {
		header: args.header,
		replacer: args.replacer,
		pretty: args.pretty
	}).stringify (obj);
	
	return s;
};