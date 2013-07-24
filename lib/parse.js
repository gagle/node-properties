"use strict";

var hex = function (c){
	switch (c){
		case "0": return 0;
		case "1": return 1;
		case "2": return 2;
		case "3": return 3;
		case "4": return 4;
		case "5": return 5;
		case "6": return 6;
		case "7": return 7;
		case "8": return 8;
		case "9": return 9;
		case "a": case "A": return 10;
		case "b": case "B": return 11;
		case "c": case "C": return 12;
		case "d": case "D": return 13;
		case "e": case "E": return 14;
		case "f": case "F": return 15;
	}
};

module.exports = function (data, options, handlers, control){
	var c;
	var escape;
	var skipSpace = true;
	var isCommentLine;
	var isSectionLine;
	var newLine = true;
	var multiLine;
	var isKey = true;
	var key = "";
	var value = "";
	var section;
	var unicode;
	var unicodeRemaining;
	var escapingUnicode;
	var keySpace;
	var sep;
	var ignoreLine;
	
	var line = function (){
		if (key || value || sep){
			handlers.line (key, value);
			key = "";
			value = "";
			sep = false;
		}
	};
	
	var escapeString = function (key, c){
		if (escapingUnicode && unicodeRemaining){
			unicode = (unicode<<4) + hex (c);
			if (--unicodeRemaining) return key;
			escape = false;
			escapingUnicode = false;
			return key + String.fromCharCode (unicode);
		}
		
		if (c === "u"){
			unicode = 0;
			escapingUnicode = true;
			unicodeRemaining = 4;
			return key;
		}
		
		escape = false;
		
		if (c === "t") return key + "\t";
		else if (c === "r") return key + "\r";
		else if (c === "n") return key + "\n";
		else if (c === "f") return key + "\f";
		
		return key + c;
	};
	
	for (var i=0, ii=data.length; i<ii; i++){
		if (control.abort) return;
		c = data[i];
		
		if (c === "\r") continue;
		
		if (isCommentLine){
			if (c === "\n"){
				isCommentLine = false;
				newLine = true;
				skipSpace = true;
			}
			continue;
		}
		
		if (isSectionLine && c === "]"){
			handlers.section (section);
			//Ignore chars after the section in the same line
			ignoreLine = true;
			continue;
		}
		
		if (skipSpace){
			if (c === " " || c === "\t" || c === "\f"){
				continue;
			}
			if (!multiLine && c === "\n"){
				//Empty line or key w/ separator and w/o value
				isKey = true;
				keySpace = false;
				line ();
				continue;
			}
			skipSpace = false;
			multiLine = false;
		}
		
		if (newLine){
			newLine = false;
			if (c === "#" || c === "!" || options.comments[c]){
				isCommentLine = true;
				continue;
			}
			if (options.sections && c === "["){
				section = "";
				isSectionLine = true;
				control.skipSection = false;
				continue;
			}
		}
		
		if (c !== "\n"){
			if (control.skipSection || ignoreLine) continue;
			
			if (!isSectionLine){
				if (!escape && (c === "=" || c === ":" || options.separators[c])){
					if (isKey){
						//sep is needed to detect empty key and empty value with a
						//non-whitespace separator
						sep = true;
						isKey = false;
						keySpace = false;
						//Skip whitespace between separator and value
						skipSpace = true;
						continue;
					}
				}
				
				if (keySpace){
					//Line with whitespace separator
					keySpace = false;
					isKey = false;
				}
			}
			
			if (c === "\\"){
				if (escape){
					if (isSectionLine) section += "\\";
					else if (isKey) key += "\\";
					else value += "\\";
				}
				escape = !escape;
			}else{
				if (isSectionLine){
					if (escape) section = escapeString (section, c);
					else section += c;
				}else if (isKey){
					if (escape){
						key = escapeString (key, c);
					}else{
						if (c === " " || c === "\t" || c === "\f"){
							keySpace = true;
							//Skip whitespace between key and separator
							skipSpace = true;
							continue;
						}
						key += c;
					}
				}else{
					if (escape) value = escapeString (value, c);
					else value += c;
				}
			}
		}else{
			if (escape){
				escape = false;
				skipSpace = true;
				multiLine = true;
			}else{
				if (isSectionLine){
					isSectionLine = false;
					ignoreLine = false;
				}
				newLine = true;
				skipSpace = true;
				isKey = true;
				
				line ();
			}
		}
	}
	
	line ();
};