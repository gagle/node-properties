/**
 * @name Properties.
 * @description A Java .properties file parser ported to node.js.
 *
 * @author Gabriel Llamas
 * @created 08/04/2012
 * @modified 22/07/2012
 * @version 0.1.9
 */
"use strict";

var BufferedReader = require ("buffered-reader");
var BufferedWriter = require ("buffered-writer");

var unicodeStringToCharacter = function (string){
	var value = 0;
	var c;
	
	for (var i=0; i<4; i++){
		c = string[i];
		switch (c){
			case "0": case "1": case "2": case "3": case "4":
			case "5": case "6": case "7": case "8": case "9":
				value = (value << 4) + c.charCodeAt (0) - 48;
				break;
			case "a": case "b": case "c":
			case "d": case "e": case "f":
				value = (value << 4) + c.charCodeAt (0) - 88;
				break;
			case "A": case "B": case "C":
			case "D": case "E": case "F":
				value = (value << 4) + c.charCodeAt (0) - 55;
				break;
		}
	}
	
	return String.fromCharCode (value);
};

var characterToUnicodeString = function (c){
    var code = c.charCodeAt (0);
	return "\\u" + toHex (code >> 12) + toHex (code >> 8) + toHex (code >> 4) + toHex (code);
};

var toHex = function (n){
	var hex = "0123456789ABCDEF";
	return (hex[n & 0xF]);
};

var PropertyReader = function (onLine, onEOF){
	this._onLine = onLine;
	this._onEOF = onEOF;
	this._skipWhiteSpace = true;
	this._isCommentLine = false;
	this._isNewLine = true;
	this._appendedLineBegin = false;
	this._precedingBackslash = false;
	this._skipLF = false;
	this._line = "";
};

PropertyReader.prototype._convert = function (offset, end, string){
	var c;
	var ret = "";
	var value;
	while (offset < end){
		c = string[offset++];
		if (c === "\\"){
			c = string[offset++];
			if (c === "u"){
				ret += unicodeStringToCharacter (
					string[offset++] + string[offset++] + string[offset++] + string[offset++]);
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

PropertyReader.prototype._readKeyValue = function (line){
	var hasSep = false;
	var precedingBackslash = false;
	var limit = line.length;
	var valueStart = limit;
	var keyLen = 0;
	var c;
	
	while (keyLen < limit){
		c = line[keyLen];
		if ((c === "=" || c === ":") && !precedingBackslash){
			valueStart = keyLen + 1;
			hasSep = true;
			break;
		}else if ((c === " " || c === "\t" ||  c == "\f") && !precedingBackslash){
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
		if (c !== " " && c !== "\t" && c !== "\f"){
			if (!hasSep && (c === "=" || c === ":")){
				hasSep = true;
			}else{
				break;
			}
		}
		valueStart++;
	}
	
	this._onLine (this._convert (0, keyLen, line),
		this._convert (valueStart, limit, line));
};

PropertyReader.prototype.eof = function (){
	if (this._line){
		this._readKeyValue (this._line);
	}
	
	this._onEOF ();
};

PropertyReader.prototype.parse = function (c){
	if (this._isCommentLine){
		if (c === "\r" || c === "\n"){
			this._isCommentLine = false;
			this._isNewLine = true;
			this._skipWhiteSpace = true;
		}
		return;
	}
	if (this._skipLF){
		this._skipLF = false;
		if (c === "\n"){
			return;
		}
	}
	if (this._skipWhiteSpace){
		if (c === " " || c === "\t" || c === "\f"){
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
		if (c === "#" || c === "!"){
			this._isCommentLine = true;
			return;
		}
	}
	
	if (c !== "\n" && c !== "\r"){
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

var Properties = function (){
	this._keys = {};
};

Properties.COMMENT = "#";
Properties.SENSITIVITY = true;
Properties.SEPARATOR = "=";

Properties.prototype.get = function (key, defaultValue){
	var k = this._keys[key];
	return k !== undefined ? k.value : defaultValue;
};

Properties.prototype.keys = function (){
	return Object.keys (this._keys);
};

Properties.prototype.load = function (fileName, cb){
	if (cb) cb = cb.bind (this);
	var me = this;
	var pr = new PropertyReader (function (key, value){
		if (!Properties.SENSITIVITY){
			var keyInsensitive = key.toLowerCase ();
			for (var storedKey in me._keys){
				if (keyInsensitive === storedKey.toLowerCase ()) return;
			}
		}
		
		me._keys[key] = {
			value: value
		}
	}, function (){
		if (cb) cb (null);
	});
	
	new BufferedReader (fileName, { encoding: "utf8" })
		.on ("error", function (error){
			if (cb) cb (error);
		})
		.on ("character", function (character){
			pr.parse (character);
		})
		.on ("end", function (){
			pr.eof ();
		})
		.read ();
};

Properties.prototype.remove = function (key){
	if (!Properties.SENSITIVITY){
		var keyInsensitive = key.toLowerCase ();
		for (var storedKey in this._keys){
			if (keyInsensitive === storedKey.toLowerCase ()){
				delete this._keys[storedKey];
				break;
			}
		}
	}else{
		delete this._keys[key];
	}
	return this;
};

Properties.prototype.set = function (key, value, comment){
	if (!Properties.SENSITIVITY){
		var keyInsensitive = key.toLowerCase ();
		for (var storedKey in this._keys){
			if (keyInsensitive === storedKey.toLowerCase ()) return this;
		}
	}
	
	this._keys[key] = {
		value: value ? value.toString () : value,
		comment: comment
	};
	return this;
};

var convert = function (string, escapeSpace, unicode){
	var c;
	var code;
	var ret = "";
	
	if (!string) return ret;
	
	for (var i=0, len=string.length; i<len; i++){
		c = string[i];
		code = c.charCodeAt (0);
		if (code > 61 && code < 127){
			if (c === "\\"){
				ret += "\\";
				ret += "\\";
			}else{
				ret += c;
			}
			continue;
		}
		
		switch (c){
			case " ":
				if (i === 0 || escapeSpace){
					ret += "\\";
				}
				ret += " ";
				break;
			case "\t":
				ret += "\\";
				ret += "t";
				break;
			case "\n":
				ret += "\\";
				ret += "n";
				break;
			case "\r":
				ret += "\\";
				ret += "r";
				break;
			case "\f":
				ret += "\\";
				ret += "f";
				break;
			case "=":
			case ":":
			case "#":
			case "!":
				ret += "\\";
				ret += c;
				break;
			default:
				if (code < 33 || code > 126){
					ret += unicode ? characterToUnicodeString (c) : c;
				}else{
					ret += c;
				}
		}
	}
	
	return ret;
};

Properties.prototype.store = function (fileName, unicode, headerComment, cb){
	var argsLen = arguments.length;
	var type;
	if (argsLen === 1){
		unicode = false;
	}else if (argsLen === 2){
		type = typeof unicode;
		if (type === "function"){
			cb = unicode;
			unicode = false;
			headerComment = null;
		}else if (type === "string"){
			headerComment = unicode;
			unicode = false;
		}
	}else if (argsLen === 3){
		type = typeof unicode;
		if (type === "boolean" && typeof headerComment === "function"){
			cb = headerComment;
			headerComment = null;
		}else if (type === "string"){
			cb = headerComment;
			headerComment = unicode;
			unicode = false;
		}
	}
	
	if (cb) cb = cb.bind (this);
	var bw = new BufferedWriter (fileName, { encoding: "utf8" });
	bw.on ("error", function (error){
		if (cb) cb (error);
	});
	
	bw.write ("");
	
	if (headerComment){
		bw.write (Properties.COMMENT + headerComment).newLine ();
	}
	
	var k;
	for (var p in this._keys){
		k = this._keys[p];
		if (k.comment){
			bw.write (Properties.COMMENT + k.comment).newLine ();
		}
		bw.write (convert (p, true, unicode) + Properties.SEPARATOR +
			convert (k.value, false, unicode)).newLine ();
	}
	
	bw.close (function (){
		if (cb) cb (null);
	});
};

module.exports = Properties;