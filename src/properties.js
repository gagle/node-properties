/**
 * @name Properties.
 * @description Provides a simple way for persisting key-value properties for node.js.
 *
 * @author Gabriel Llamas
 * @created 08/04/2012
 * @modified 15/04/2012
 * @version 0.1.0
 */
"use strict";

var FS = require ("fs");
var PATH = require ("path");
var BufferedReader = require ("buffered-reader").BufferedReader;

var BUFFER_SIZE = 4096;
var SLASH = PATH.normalize ("/");
var EOL = process.platform.indexOf ("win") !== -1 ? "\r\n" : "\n";

var charFromUnicodeString = function (string){
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

var unicodeStringFromChar = function (c){
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
				ret += charFromUnicodeString (
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

var getFileName = function (fileName){
	var main = process.mainModule.filename;
	var cwd = main.substring (0, main.lastIndexOf (SLASH));
	var relative = PATH.relative (process.cwd (), cwd);
	return PATH.join (relative, fileName);
};

var Properties = function (){
	this._keys = {};
};

Properties.SEPARATOR = "=";

Properties.prototype.get = function (key, defaultValue){
	var value = this._keys[key];
	return value !== undefined ? value : defaultValue;
};

Properties.prototype.keys = function (){
	return Object.keys (this._keys);
};

Properties.prototype.load = function (fileName, cb){
	var me = this;
	
	var pr = new PropertyReader (function (key, value){
		me._keys[key] = value;
	}, function (){
		cb (null, true);
	});
	
	new BufferedReader (fileName, BUFFER_SIZE, "utf8")
		.on ("error", function (error){
			if (cb) cb (error, false);
		})
		.on ("character", function (character){
			pr.parse (character);
		})
		.on ("end", function (){
			pr.eof ();
		})
		.read ();
};

Properties.prototype.set = function (key, value){
	this._keys[key] = value ? value.toString () : "";
	return this;
};

var convert = function (string, escapeSpace, unicode){
	var c;
	var code;
	var ret = "";
	
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
					ret += unicode ? unicodeStringFromChar (c) : c;
				}else{
					ret += c;
				}
		}
	}
	
	return ret;
};

Properties.prototype.store = function (fileName, unicode, cb){
	if (arguments.length === 2 && typeof unicode === "function"){
		cb = unicode;
		unicode = false;
	}
	
	var s = FS.createWriteStream (getFileName (fileName));
	s.on ("close", function (){
		if (cb) cb (null, true);
	});
	s.on ("error", function (error){
		if (cb) cb (error, false);
	});
	
	for (var p in this._keys){
		s.write (convert (p, true, unicode) + Properties.SEPARATOR +
			convert (this._keys[p], false, unicode) + EOL);
	}
	
	s.end ();
};

module.exports.Properties = Properties;