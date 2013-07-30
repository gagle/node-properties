"use strict";

var escape = require ("./escape");

//The data doesn't need to be buffered because .properties files typically
//have a size less than a block (default is 16KB)

var EOL = process.platform === "win32" ? "\r\n" : "\n";

var stringifyComment = function (meta, comment, options){
	var c;
	var code;
	var pcode;
	var fcode;
	var str = "";
	var lastWord;
	var findLastWord = true;
	var line = options._comment;
	var skipWhitespace;
	var found;
	var lineIndex = 0;
	var readWord;
	var bigLine;
	
	meta.comment = true;
	meta.unicode = options.unicode;
	
	for (var i=0, ii=comment.length; i<ii; i++, lineIndex++){
		c = comment[i];
		pcode = code;
		code = comment.charCodeAt (i);
		
		if (code === 13){
			//code 13: \r
			continue;
		}else if (code === 10){
			//code 10: \n
			str += line + EOL;
			line = options._comment;
			lineIndex = 0;
			lastWord = null;
			readWord = false;
			bigLine = null;
		}else{
			//code 32: " " (space)
			//code 9: \t
			//code 12: \f
			
			if (skipWhitespace){
				if (code === 32 || code === 9 || code === 12){
					continue;
				}else{
					lineIndex = line ? line.length - options._comment.length : 0;
					skipWhitespace = false;
				}
			}
			
			if (bigLine){
				str += bigLine + EOL;
				bigLine = null;
				lastWord = null;
				line = options._comment;
			}
			
			if (findLastWord){
				if ((code === 32 || code === 9 || code === 12) &&
						(pcode && pcode !== 32 && pcode !== 9 && pcode !== 12)){
					lastWord = lineIndex + options._comment.length;
					findLastWord = false;
				}
			}else if (code !== 32 && code !== 9 && code !== 12){
				findLastWord = true;
			}
			
			if (readWord && (code === 32 || code === 9 || code === 12)){
				readWord = false;
				bigLine = line;
				line = null;
				skipWhitespace = true;
				continue;
			}
			
			line += escape (meta, code, c);
			
			if (!readWord && line.length > options._columns){
				if (!lastWord){
					//A word is bigger than the line max length
					//Read all the remaining word
					readWord = true;
					continue;
				}
				
				str += line.substring (0, lastWord) + EOL;
				skipWhitespace = code === 32 || code === 9 || code === 12;
				found = false;
				
				//Find first word
				for (var j=lastWord, jj=line.length; j<jj; j++){
					fcode = line.charCodeAt (j);
					if (fcode !== 32 && fcode !== 9 && fcode !== 12){
						line = options._comment + line.substring (j);
						lineIndex = line.length - 1 - options._comment.length;
						lastWord = null;
						found = true;
						break;
					}
				}
				
				if (!found) line = options._comment;
			}
		}
	}
	
	//Concatenate the remaining line
	return str + (bigLine || line);
};

module.exports = function (obj, options){
	var str = "";
	var meta = {};

	if (options.header){
		str += stringifyComment (meta, options.header, options) + EOL + EOL;
	}
	
	return str;
};