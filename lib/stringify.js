"use strict";

var escape = require ("./escape");
var Builder = require ("./builder");

//The data doesn't need to be buffered because .properties files typically
//have a size less than a block (default is 16KB)

var EOL = process.platform === "win32" ? "\r\n" : "\n";

var stringifyComment = function (comment, meta, options){
	var c;
	var code;
	var str = options._comment;
	
	for (var i=0, ii=comment.length; i<ii; i++){
		c = comment[i];
		code = comment.charCodeAt (i);
		
		//code 13: \r
		if (code === 13) continue;
		
		if (code === 10){
			//code 10: \n
			str += EOL + options._comment;
		}else{
			str += escape (c, code, meta, options);
		}
	}
	
	return str;
};

var stringifyKey = function (s, meta, options){
	var c;
	var code;
	var str = "";
	
	for (var i=0, ii=s.length; i<ii; i++){
		c = s[i];
		code = s.charCodeAt (i);
		str += escape (c, code, meta, options);
	}
	
	return str;
};

var stringifyValue = function (s, meta, options){
	var c;
	var code;
	var str = "";
	
	for (var i=0, ii=s.length; i<ii; i++){
		c = s[i];
		code = s.charCodeAt (i);
		
		//code 32: " " (space)
		//code 9: \t
		//code 12: \f
		if (code !== 32 && code !== 9 && code !== 12){
			meta.whitespace = false;
		}
		
		str += escape (c, code, meta, options);
	}
	
	return str;
};

var stringifySection = stringifyKey;

var toString = function (o){
	if (typeof o === "object"){
		return JSON.stringify (o);
	}else{
		return o + "";
	}
};

module.exports = function (builder, options){
	var str = "";
	var meta = {
		separator: options._separator.charCodeAt (0)
	};
	var first = true;
	var currentSection = null;
	var skipSection;
	var value;
	var replace;
	
	var o = {
		assert: function (){
			return replace.property ? replace.value : true;
		}
	};
	
	if (builder._header){
		meta.comment = true;
		str += stringifyComment (builder._header, meta, options) + EOL + EOL;
		meta.comment = false;
	}
	
	builder._lines.forEach (function (line){
		replace = line;
	
		if (options.replacer){
			if (line.property){
				if (skipSection) return;
				value = options.replacer.call (o, line.key, line.value, currentSection);
				if (value === undefined) return;
				line.value = value;
			}else{
				skipSection = false;
				if (options.replacer.call (o, null, null, line.name)){
					currentSection = line.name;
				}else{
					skipSection = true;
					return;
				}
			}
		}
	
		if (!first) str += EOL;
		
		if (line.comment){
			meta.comment = true;
			str += stringifyComment (line.comment, meta, options) + EOL;
			meta.comment = false;
		}
		
		if (line.property){
			meta.whitespace = true;
			
			if (line.key !== null && line.key !== undefined){
				meta.key = true;
				str += stringifyKey (toString (line.key), meta, options);
				meta.key = false;
			}
			
			str += options._separator;
			
			if (line.value !== null && line.value !== undefined){
				str += stringifyValue (toString (line.value), meta, options);
			}
			
			meta.whitespace = false;
		}else{
			if (line.name){
				str += "[" + stringifySection (toString (line.name), meta, options) +
						"]";
			}else{
				str += "[]";
			}
		}
		
		first = false;
	});
	
	return str;
};