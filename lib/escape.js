"use strict";

var unicode = function (code){
	var unicode = code.toString (16);
	while (unicode.length !== 4){
		unicode = "0" + unicode;
	}
	return "\\u" + unicode;
};

module.exports = function (meta, code, c){
	//ASCII printable characters
	if (code > 31 && code < 127){
		//Space at the begining of a word
		//If whitespace is true the space needs to be escaped
		//In comments, meta.whitespace is always false
		if (code === 32 && meta.whitespace){
			return "\\ ";
		}
		//Backslash
		if (code === 92) return "\\\\";
		return c;
	}
	
	//ASCII non-printable characters
	//Escaped
	if (code === 9) return meta.comment ? c : "\\t";
	//Is never a comment
	if (code === 10) return "\\n";
	if (code === 12) return meta.comment ? c : "\\f";
	if (code === 13) return meta.comment ? c : "\\r";
	
	//Control sets 0 and 1
	if (code < 160) return unicode (code);
	
	//ASCII extended and multibyte characters
	return meta.unicode ? unicode (code) : c;
};