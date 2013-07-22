"use strict";

var white = {
	" ": null,
	"\t": null,
	"\f": null
};

var Reader = module.exports = function (onLine, onSection, onEOF, config){
	this._onLine = onLine;
	this._onSection = onSection;
	this._onEOF = onEOF;
	this._skipWhiteSpace = true;
	this._skipSection = false;
	this._isCommentLine = false;
	this._isNewLine = true;
	this._isSectionLine = false;
	this._appendedLineBegin = false;
	this._precedingBackslash = false;
	this._skipLF = false;
	this._line = "";
	this._section = null;
	this._comments = config.comments;
	this._separators = config.separators;
};

Reader.prototype._isComment = function (c){
	return c in this._comments;
};

Reader.prototype._isSeparator = function (c){
	return c in this._separators;
};

Reader.prototype._isWhiteSpace = function (c){
	return c in white;
};

Reader.prototype._readKeyValue = function (line){
	var hasSep = false;
	var precedingBackslash = false;
	var limit = line.length;
	var valueStart = limit;
	var keyLen = 0;
	var c;
	
	while (keyLen < limit){
		c = line[keyLen];
		if (this._isSeparator (c) && !precedingBackslash){
			valueStart = keyLen + 1;
			hasSep = true;
			break;
		}else if (this._isWhiteSpace (c) && !precedingBackslash){
			valueStart = keyLen + 1;
			break;
		}
		if (c === "\\"){
			precedingBackslash = !precedingBackslash;
		}else{
			precedingBackslash = false;
		}
		keyLen++;
	}
	
	while (valueStart < limit){
		c = line[valueStart];
		if (!this._isWhiteSpace (c)){
			if (!hasSep && this._isSeparator (c)){
				hasSep = true;
			}else{
				break;
			}
		}
		valueStart++;
	}
	
	this._onLine (this._unescape (0, keyLen, line),
			this._unescape (valueStart, limit, line),
			this._onSection ? this._section : null);
};

Reader.prototype._unescape = function (offset, end, string){
	var c;
	var ret = "";
	var value;
	while (offset < end){
		c = string[offset++];
		if (c === "\\"){
			c = string[offset++];
			if (c === "u"){
				ret += String.fromCharCode (parseInt (string[offset++] +
						string[offset++] + string[offset++] + string[offset++], 16));
			}else{
				if (c === "t") c = "\t";
				else if (c === "r") c = "\r";
				else if (c === "n") c = "\n";
				else if (c === "f") c = "\f";
				ret += c;
			}
		}else{
			ret += c;
		}
	}
	return ret;
};

Reader.prototype.eof = function (){
	if (this._line){
		this._readKeyValue (this._line);
	}
	if (this._onEOF) this._onEOF ();
};

Reader.prototype.parse = function (c){
	if (this._isCommentLine){
		if (c === "\r" || c === "\n"){
			this._isCommentLine = false;
			this._isNewLine = true;
			this._skipWhiteSpace = true;
		}
		return;
	}
	if (this._onSection){
		if (this._isNewLine && this._skipSection){
			if (c !== "["){
				return;
			}
			this._skipSection = false;
		}
		if (this._isSectionLine){
			if (c === "]"){
				this._onSection (this._section);
				return;
			}
			if (c === "\r" || c === "\n"){
				this._isSectionLine = false;
				this._isNewLine = true;
				this._skipWhiteSpace = true;
				return;
			}
			
			this._section += c;
			return;
		}
	}
	if (this._skipLF){
		this._skipLF = false;
		if (c === "\n"){
			return;
		}
	}
	if (this._skipWhiteSpace){
		if (this._isWhiteSpace (c)){
			return;
		}
		if (!this._appendedLineBegin && (c === "\r" || c === "\n")){
			return;
		}
		this._skipWhiteSpace = false;
		this._appendedLineBegin = false;
	}
	if (this._isNewLine){
		this._isNewLine = false;
		if (this._isComment (c)){
			this._isCommentLine = true;
			return;
		}
		if (this._onSection && c === "["){
			this._isSectionLine = true;
			this._section = "";
			return;
		}
	}
	
	if (c !== "\r" && c !== "\n"){
		this._line += c;
		if (c === "\\"){
			this._precedingBackslash = !this._precedingBackslash;
		}else{
			this._precedingBackslash = false;
		}
	}else{
		if (this._precedingBackslash){
			this._line = this._line.substring (0, this._line.length - 1);
			this._skipWhiteSpace = true;
			this._appendedLineBegin = true;
			this._precedingBackslash = false;
			if (c === "\r"){
				this._skipLF = true;
			}
		}else{
			this._isNewLine = true;
			this._skipWhiteSpace = true;
			
			if (this._line){
				this._readKeyValue (this._line);
			}
			this._line = "";
		}
	}
};

Reader.prototype.section = function (section){
	this._section = section;
};

Reader.prototype.skipSection = function (){
	this._skipSection = true;
};