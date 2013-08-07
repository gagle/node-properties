"use strict";

var fs = require ("fs");
var path = require ("path");
var parse = require ("./parse");
var PropertiesError = require ("./error");

var INCLUDE_KEY = "include";
var INDEX_FILE = "index.properties";

var convertType = function (value, cb){
	if (value === null) return cb (null, null);
	if (value === "null") return cb (null, null);
	if (value === "true") return cb (null, true);
	if (value === "false") return cb (null, false);
	var v = Number (value);
	if (isNaN (v)) return cb (null, value);
	cb (null, v); 
};

var convertJson = function (value, cb){
	if (value === null) return cb (null, null);
	
	if (value[0] === "{" || value[0] === "["){
		try{
			cb (null, JSON.parse (value));
		}catch (error){
			cb (new PropertiesError (error));
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
	var n;
	
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
					return cb (new PropertiesError ("The section \"" + section +
							"\" does not exist"));
				}
				
				v = holder[key];
				if (v === undefined){
					//Read the external vars
					if (options.namespaces){
						v = namespaceValue (options._vars, key);
					}else{
						v = options._vars[key];
					}
					
					if (v === undefined){
						return cb (new PropertiesError ("The property \"" + key +
								"\" does not exist"));
					}
				}
				
				//If json is enabled, arrays and objects must be stringified
				if (options.json && typeof v === "object"){
					v = JSON.stringify (v);
				}
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
		return cb (new PropertiesError ("Malformed variable: " + str));
	}
	
	cb (null, key);
};

var namespaceValue = function (p, key){
	var n = key.split (".");
	var str;
	
	for (var i=0, ii=n.length-1; i<ii; i++){
		str = n[i];
		if (p[str] === undefined) return;
		p = p[str];
	}
	
	return p[n[n.length - 1]];
};

var namespace = function (p, key, value){
	var n = key.split (".");
	var str;
	
	for (var i=0, ii=n.length-1; i<ii; i++){
		str = n[i];
		if (p[str] === undefined){
			p[str] = {};
		}
		p = p[str];
	}
	
	p[n[n.length - 1]] = value;
};

var merge = function (o1, o2){
	var v;
	
	for (var p in o2){
		if (p in o1){
			v = o2[p];
			if (!Array.isArray (v) && typeof v === "object"){
				o1[p] = merge (o1[p], v);
			}else{
				o1[p] = o2[p];
			}
		}else{
			o1[p] = o2[p];
		}
	}
	
	return o1;
};

var build = function (data, options, cb){
	var o = {};
	
	if (options.namespaces){
		var n = {};
	}
	
	if (options.include){
		var remainingIncluded = 0;
		
		var include = function (value){
			var p = path.resolve (value);
			if (options._included[p]) return;
			
			options._included[p] = true;
			remainingIncluded++;
			control.pause = true;
			
			read (p, options, function (error, included){
				if (error) return abort (error);
				
				remainingIncluded--;
				merge (o, included);
				control.pause = false;
				
				parse (data, options, handlers, control);
				
				if (!remainingIncluded) cb (null, options.namespaces ? n : o);
			});
		};
	}
	
	if (!data){
		if (cb) return cb (null, o);
		return o;
	}
	
	var convert = options.json ? convertJson : convertType;
	var currentSection = null;
	
	var abort = function (error){
		control.abort = true;
		if (cb) return cb (error);
		throw error;
	};
	
	var handlers = {};
	var reviver = {
		assert: function (){
			return this.isProperty ? reviverLine.value : true;
		}
	};
	var reviverLine = {};
	
	//Line handler
	//For speed reasons, if namespaces are enabled the old object is still
	//populated, e.g.: ${a.b} reads the "a.b" property from { "a.b": 1 }, instead
	//of having a unique object { a: { b: 1 } } which is slower to search for
	//the "a.b" value
	//If "a.b" is not found, then the external vars are read. If "namespaces" is
	//enabled the var "a.b" is split and it searches for a.b. If it is not enabled
	//then the var "a.b" searches for "a.b"
	
	var line;
	if (options.reviver){
		if (options.sections){
			line = function (key, value){
				if (options.include && key === INCLUDE_KEY) return include (value);
				
				reviverLine.value = value;
				reviver.isProperty = true;
				reviver.isSection = false;
				
				value = options.reviver.call (reviver, key, value, currentSection);
				if (value !== undefined){
					if (currentSection === null) o[key] = value;
					else o[currentSection][key] = value;
					
					if (options.namespaces){
						namespace (currentSection === null ? n : n[currentSection], key,
								value);
					}
				}
			};
		}else{
			line = function (key, value){
				if (options.include && key === INCLUDE_KEY) return include (value);
				
				reviverLine.value = value;
				reviver.isProperty = true;
				reviver.isSection = false;
				
				value = options.reviver.call (reviver, key, value);
				if (value !== undefined){
					o[key] = value;
					
					if (options.namespaces){
						namespace (n, key, value);
					}
				}
			};
		}
	}else{
		if (options.sections){
			line = function (key, value){
				if (options.include && key === INCLUDE_KEY) return include (value);
				
				if (currentSection === null) o[key] = value;
				else o[currentSection][key] = value;
				
				if (options.namespaces){
					namespace (currentSection === null ? n : n[currentSection], key,
							value);
				}
			};
		}else{
			line = function (key, value){
				if (options.include && key === INCLUDE_KEY) return include (value);
				
				o[key] = value;
				
				if (options.namespaces){
					namespace (n, key, value);
				}
			};
		}
	}
	
	//Section handler
	var section;
	if (options.sections){
		if (options.reviver){
			section = function (section){
				reviverLine.section = section;
				reviver.isProperty = false;
				reviver.isSection = true;
				
				var add = options.reviver.call (reviver, null, null, section);
				if (add){
					currentSection = section;
					o[currentSection] = {};
					
					if (options.namespaces){
						n[currentSection] = {};
					}
				}else{
					control.skipSection = true;
				}
			};
		}else{
			section = function (section){
				currentSection = section;
				o[currentSection] = {};
				
				if (options.namespaces){
					n[currentSection] = {};
				}
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
						
						line (key, value);
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
				
				line (key, value);
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
	
	if (control.abort || control.pause) return;
	
	if (cb) return cb (null, options.namespaces ? n : o);
	return options.namespaces ? n : o;
};

var read = function (f, options, cb, first){
	fs.stat (f, function (error, stats){
		if (error) return cb (error);
		
		if (stats.isDirectory ()){
			if (first) options._basedir = f;
			f = path.join (f, INDEX_FILE);
		}else if (first){
			options._basedir = ".";
		}
		
		fs.readFile (f, { encoding: "utf8" }, function (error, data){
			if (error) return cb (error);
			build (data, options, cb);
		});
	});
};

module.exports = function (data, options, cb){
	if (typeof options === "function"){
		cb = options;
		options = {};
	}
	
	var code;
	
	if (options.include){
		options._included = {};
	}
	
	options = options || {};
	options._strict = options.strict && (options.comments || options.separators);
	options._vars = options.vars || {};
	
	var comments = options.comments || [];
	if (!Array.isArray (comments)) comments = [comments];
	var c = {};
	comments.forEach (function (comment){
		code = comment.charCodeAt (0);
		if (comment.length > 1 || code < 33 || code > 126){
			throw new PropertiesError ("The comment token must be a single " +
					"printable ASCII character");
		}
		c[comment] = true;
	});
	options._comments = c;
	
	var separators = options.separators || [];
	if (!Array.isArray (separators)) separators = [separators];
	var s = {};
	separators.forEach (function (separator){
		code = separator.charCodeAt (0);
		if (separator.length > 1 || code < 33 || code > 126){
			throw new PropertiesError ("The separator token must be a single " +
					"printable ASCII character");
		}
		s[separator] = true;
	});
	options._separators = s;
	
	if (options.path){
		if (!cb) throw new PropertiesError ("A callback must be passed if the " +
				"data is a path");
		read (data, options, cb, true);
	}else{
		return build (data, options, cb);
	}
};