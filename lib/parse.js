"use strict";

var fs = require ("fs");
var reader = require ("./reader");

var convertType = function (value, cb){
	if (value === null) return cb (null, null);
	var lower = value.toLowerCase ();
	if (lower === "true") return cb (null, true);
	if (lower === "false") return cb (null, false);
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

var expand = function  (o, str, settings, cb){
	if (!settings.variables || !str) return cb (null, str);
	
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
			if (settings.sections && c === "|"){
				section = key;
				key = "";
				continue;
			}else if (c === "}"){
				holder = section !== null ? o[section] : o;
				if (!holder){
					return cb (new Error ("Cannot found the section \"" + section + "\""),
							null);
				}
				if (!(key in holder)){
					return cb (new Error ("Cannot found the property \"" + key + "\""),
							null);
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
		return cb (new Error ("Malformed variable: " + str), null);
	}
	
	cb (null, key);
};

var build = function (data, settings, cb){
	var o = {};
	var convert = settings.json ? convertJson : convertType;
	var currentSection = null;
	
	//Line handler
	var line;
	if (settings.reviver){
		settings.reviver.isProperty = true;
		settings.reviver.isSection = false;
		
		if (settings.sections){
			line = function (error, key, value){
				value = settings.reviver (key, value, currentSection);
				if (value !== undefined){
					if (currentSection === null) o[key] = value;
					else (o[currentSection])[key] = value;
				}
			};
		}else{
			line = function (error, key, value){
				value = settings.reviver (key, value);
				if (value !== undefined) o[key] = value;
			};
		}
	}else{
		if (settings.sections){
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
	if (settings.reviver){
		settings.reviver.isProperty = false;
		settings.reviver.isSection = true;
		
		section = function (section){
			var add = settings.reviver (null, null, section);
			if (add){
				currentSection = section;
				o[currentSection] = {};
			}else{
				r.skipSection ();
			}
		};
	}else{
		section = function (section){
			currentSection = section;
			o[currentSection] = {};
		};
	}
	
	var abort = function (error){
		r.abort ();
		cb (error);
	};
	
	var r = reader.create (data, settings)
			.on ("line", function (key, value){
				//Variable expansion
				expand (o, key, settings, function (error, key){
					if (error) return abort (error);
					
					expand (o, value, settings, function (error, value){
						if (error) return abort (error);
						
						//Type conversion
						convert (value || null, function (error, value){
							if (error) return abort (error);
							
							line (error, key, value);
						});
					});
				});
			})
			.on ("section", function (s){
				expand (o, s, settings, function (error, s){
					if (error) return abort (error);
					
					section (s);
				});
			})
			.on ("end", function (){
				if (settings.reviver){
					delete settings.reviver.isProperty;
					delete settings.reviver.isSection;
				}
				cb (null, o);
			});
};

module.exports = function (p, settings, cb){
	if (arguments.length === 2){
		cb = settings;
		settings = {
			json: true
		};
	}
	
	if (settings.json === undefined) settings.json = true;
	
	if (!settings.data){
		fs.readFile (p, { encoding: "utf8" }, function (error, data){
			if (error) return cb (error);
			build (data, settings, cb);
		});
	}else{
		build (p, settings, cb);
	}
};