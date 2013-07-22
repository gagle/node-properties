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

var build = function (data, settings, cb){
	var o = {};
	var convert = settings.json ? convertJson : convertType;
	
	reader.create (data, settings)
			.on ("line", function (key, value){
				var me = this;
				
				//Type conversion
				convert (value || null, function (error, value){
					if (error){
						me.abort ();
						cb (error);
						return;
					}
					
					if (settings.reviver){
						value = settings.reviver (key, value);
						if (value !== undefined) o[key] = value;
					}else{
						o[key] = value;
					}
				});
			})
			.on ("end", function (){
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