"use strict";

var fs = require ("fs");
var parse = require ("./parse");

var convertType = function (value, cb){
	if (value === null) return cb (null, null);
	if (value === "null") return cb (null, null);
	if (value === "true") return cb (null, true);
	if (value === "false") return cb (null, false);
	var v = Number (value);
	if (!isNaN (value)) return cb (null, v);
	cb (null, value);
};

var convertJson = function (value, cb){
	if (value === null) return cb (null, null);
	
	if (value[0] === "{" || value[0] === "["){
		try{
			cb (null, JSON.parse (value));
		}catch (error){
			cb (error);
		}
	}else{
		convertType (value, cb);
	}
};

var expand = function  (o, str, options, cb){
	if (!options.variables || !str) return cb (null, str);
	
	var stack = [];
	var c;
	var cp;
	var key = "";
	var section = null;
	var v;
	var holder;
	var t;
	
	for (var i=0, ii=str.length; i<ii; i++){
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
			if (options.sections && c === "|"){
				section = key;
				key = "";
				continue;
			}else if (c === "}"){
				holder = section !== null ? o[section] : o;
				if (!holder){
					return cb (new Error ("Cannot found the section \"" + section +
							"\""));
				}
				if (!(key in holder)){
					return cb (new Error ("Cannot found the property \"" + key + "\""));
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
		return cb (new Error ("Malformed variable: " + str));
	}
	
	cb (null, key);
};

var build = function (data, options, cb){
	var o = {};
	var convert = options.json ? convertJson : convertType;
	var currentSection = null;
	
	var abort = function (error){
		control.abort = true;
		if (cb) return cb (error);
		throw error;
	};
	
	var handlers = {};
	
	//Line handler
	var line;
	if (options.reviver){
		options.reviver.isProperty = true;
		options.reviver.isSection = false;
		
		if (options.sections){
			line = function (error, key, value){
				value = options.reviver (key, value, currentSection);
				if (value !== undefined){
					if (currentSection === null) o[key] = value;
					else o[currentSection][key] = value;
				}
			};
		}else{
			line = function (error, key, value){
				value = options.reviver (key, value);
				if (value !== undefined) o[key] = value;
			};
		}
	}else{
		if (options.sections){
			line = function (error, key, value){
				if (currentSection === null) o[key] = value;
				else o[currentSection][key] = value;
			};
		}else{
			line = function (error, key, value){
				o[key] = value;
			};
		}
	}
	
	//Section handler
	var section;
	if (options.sections){
		if (options.reviver){
			options.reviver.isProperty = false;
			options.reviver.isSection = true;
			
			section = function (section){
				var add = options.reviver (null, null, section);
				if (add){
					currentSection = section;
					o[currentSection] = {};
				}else{
					control.skipSection = true;
				}
			};
		}else{
			section = function (section){
				currentSection = section;
				o[currentSection] = {};
			};
		}
	}
	
	//Variables
	if (options.variables){
		handlers.line = function (key, value){
			expand (o, key, options, function (error, key){
				if (error) return abort (error);
				
				expand (o, value, options, function (error, value){
					if (error) return abort (error);
					
					convert (value || null, function (error, value){
						if (error) return abort (error);
						
						line (error, key, value);
					});
				});
			});
		};
		
		if (options.sections){
			handlers.section = function (s){
				expand (o, s, options, function (error, s){
					if (error) return abort (error);
					
					section (s);
				});
			};
		}
	}else{
		handlers.line = function (key, value){
			convert (value || null, function (error, value){
				if (error) return abort (error);
				
				line (error, key, value);
			});
		};
		
		if (options.sections){
			handlers.section = section;
		}
	}
	
	var control = {
		abort: false,
		skipSection: false
	};
	
	parse (data, options, handlers, control);
	
	if (options.reviver){
		delete options.reviver.isProperty;
		delete options.reviver.isSection;
	}
	
	if (cb) return cb (null, o);
	return o;
};

module.exports = function (data, options, cb){
	if (arguments.length === 2 && typeof options === "function"){
		cb = options;
		options = {};
	}
	
	var comments = options.comments || [];
	if (!Array.isArray (comments)) comments = [comments];
	var c = {};
	comments.forEach (function (comment){
		c[comment] = true;
	});
	
	var separators = options.separators || [];
	if (!Array.isArray (separators)) separators = [separators];
	var s = {};
	separators.forEach (function (separator){
		s[separator] = true;
	});
	
	options = {
		json: options.json,
		path: options.path,
		sections: options.sections,
		variables: options.variables,
		reviver: options.reviver,
		comments: c,
		separators: s
	};
	
	if (options.path){
		if (!cb) throw new TypeError ("A callback must be passed if the data is " +
				"a path");
		fs.readFile (data, { encoding: "utf8" }, function (error, data){
			if (error) return cb (error);
			build (data, options, cb);
		});
	}else{
		return build (data, options, cb);
	}
};