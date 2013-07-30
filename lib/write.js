"use strict";

var stringify = require ("./stringify");
var escape = require ("./escape");

var reWhitespace = /^[ \t\f]+/;

module.exports = function (obj, options, cb){
	if (arguments.length === 2 && typeof options === "function"){
		cb = options;
		options = {};
	}
	
	options = options || {};
	
	if (options.comment){
		if (reWhitespace.test (options.comment)){
			throw new Error ("The comment token cannot begin with a whitespace " +
					"(space, \\t or \\f)");
		}
		
		var str = "";
		var meta = {
			comment: true,
			unicode: options.unicode
		};
		for (var i=0, ii=options.comment.length; i<ii; i++){
			str += escape (meta, options.comment.charCodeAt (i), options.comment[i]);
		}
		options._comment = str;
	}else{
		options._comment = "#";
	}
	
	options._separator = options.separator || "=";
	if (options.pretty){
		options._separator = " " + options._separator + " ";
		options._columns = options.columns || 80;
	}else{
		options._columns = Infinity;
	}
	
	var data = stringify (obj, options);
	
	if (options.path){
		if (!cb) throw new TypeError ("A callback must be passed if the data is " +
				"stored into a file");
		fs.writeFile (options.path, data, function (error){
			if (error) return cb (error);
			cb (null, data);
		});
	}else if (cb){
		cb (null, data);
	}else{
		return data;
	}
};