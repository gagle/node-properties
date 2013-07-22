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

properties._substitute = function  (config, props, str, cb){
	if (!config.variables || !str) return cb (null, str);
	
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
			if (config.sections && c === "|"){
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

var convertType = function (value){
	if (value === null) return null;
	var lower = value.toLowerCase ();
	if (lower === "true") return true;
	if (lower === "false") return false;
	if (!isNaN (value)) return parseInt (value);
	return value;
};

var createHandlers = function (cb, config, io){
	var props = {};
	var onSection = null;
	var e = false;
	
	var substituteAndConvert = function (key, value, callback){
		properties._substitute (config, props, key, function (error, key){
			if (error){
				e = true;
				return cb (error, null);
			}
			properties._substitute (config, props, value, function (error, value){
				if (error){
					e = true;
					return cb (error, null);
				}
				callback (key, convertType (value || null));
			});
		});
	};
	
	var onKeyValue = config.reviver
			? function (key, value, section){
				substituteAndConvert (key, value, function (key, value){
					if (config.sections){
						value = config.reviver (key, value, section);
					}else{
						value = config.reviver (key, value);
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
	
	if (config.sections){
		onSection = config.reviver
				? function (section){
					properties._substitute (config, props, section,
							function (error, section){
						if (error){
							e = true;
							return cb (error, null);
						}
						reader.section (section);
						section = config.reviver (null, null, section);
						if (section === undefined){
							reader.skipSection ();
						}else{
							props[section] = {};
						}
					});
				}
				: function (section){
					properties._substitute (config, props, section,
							function (error, section){
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
					: null,
			config);
	
	return {
		properties: function (){
			return props;
		},
		reader: reader
	};
};

var createConfigRead = function (args){
	var config = {
		comments: {
			"#": null,
			"!": null
		},
		separators: {
			"=": null,
			":": null
		},
		sections: false,
		variables: false
	};

	if (args.comments){
		args.comments.unshift ("#", "!");
		config.comments = {};
		for (var i=0, len=args.comments.length; i<len; i++){
		config.comments[args.comments[i]] = null;
		}
	}
	
	if (args.separators){
		args.separators.unshift ("=", ":");
		config.separators = {};
		for (var i=0, len=args.separators.length; i<len; i++){
			config.separators[args.separators[i]] = null;
		}
	}
	
	if (args.sections){
		config.sections = args.sections;
	}
	
	if (args.variables){
		config.variables = args.variables;
	}
	
	config.reviver = args.reviver;
	
	return config;
};


var createConfigWrite = function (args){
	var config = {
		comments: {
			"#": null,
			"!": null
		},
		separators: {
			"=": null,
			":": null
		},
		comment: {
			pretty: "# ",
			string: "#"
		},
		separator: {
			pretty: " = ",
			string: "="
		},
		sections: false
	}
	
	if ("comment" in args && args.comment !== null &&
			args.comment !== undefined){
		config.comment.string = args.comment;
		config.comment.pretty = args.comment.trim () + " ";
	}
	
	if ("separator" in args && args.separator !== null &&
			args.separator !== undefined){
		config.separator.string = args.separator;
		config.separator.pretty = " ";
		args.separator = args.separator.trim ();
		if (args.separator){
			config.separator.pretty += args.separator + " ";
		}
	}
	
	if (args.sections){
		config.sections = args.sections;
	}
	
	config.pretty = args.pretty;
	config.header = args.header;
	config.replacer = args.replacer;
	
	return config;
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
	}, createConfigRead (args), true);

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
	var handlers = createHandlers (function (error, props){
		if (error) throw error;
	}, createConfigRead (args || {}));
	
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
	
	var config = createConfigWrite (args);
	
	var out = bw.open (file, {
		encoding: config.encoding,
		bufferSize: config.bufferSize
	}).on ("error", function (error){
		cb (error);
	});
	
	new Writer (function (str){
		out.write (str);
	}, config, config.encoding === "ascii").stringify (obj);
	
	out.close (function (){
		cb (null);
	});
};

properties.stringify = function (obj, args){
	var s = "";
	args = args || {};
	
	new Writer (function (str){
		s += str;
	}, createConfigWrite (args), false).stringify (obj);
	
	return s;
};