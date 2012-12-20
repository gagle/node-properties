"use strict";

var bw = require ("buffered-writer");
var DataReader = require ("buffered-reader").DataReader;

var properties = module.exports = {};

var config = {
	comment: "#",
	separator: "="
};

properties.config = function (args){
	args = args || {};
	config.comment = args.comment || config.comment;
	config.separator = args.separator || config.separator;
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

properties.load = function (file, args, cb){
	if (arguments.length === 2){
		cb = args;
		args = {};
	}
	
	var keyValueCallback = args.onKeyValue
			? function (key, value){
				value = value || null;
				props[key] = value;
				args.onKeyValue (key, value);
			}
			: function (key, value){
				props[key] = value || null;
			}

	var props = {};
	
	var pr = new PropertyReader (keyValueCallback, function (){
		cb (null, props);
	});
	
	new DataReader (file, {
			encoding: args.encoding || "utf8",
			bufferSize: args.bufferSize
		}).on ("error", function (error){
				cb (error, null);
			})
			.on ("character", function (c){
				pr.parse (c);
			})
			.on ("end", function (){
				pr.eof ();
			})
			.read ();
};

var escapeUnicode = function (code){
	code = code.toString (16);
	while (code.length !== 4){
		code = "0" + code;
	}
	return "\\u" + code;
};

var escape = function (s, space, unicode){
	var c;
	var code;
	var ret = "";
	
	if (!s) return ret;
	
	for (var i=0, len=s.length; i<len; i++){
		c = s[i];
		code = c.charCodeAt (0);
		if (code >= 62 && code <= 126){
			if (c === "\\"){
				ret += "\\\\";
			}else{
				ret += c;
			}
			continue;
		}
		
		switch (c){
			case " ":
				if (i === 0 || space){
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
				if (code <= 31 || (code >= 127 && code <= 159)){
					//Unicode non printable characters (C0 and C1 control codes)
					ret += escapeUnicode (code);
				}else if (code > 160){
					//UTF8
					ret += unicode ? escapeUnicode (code) : c;
				}else{
					//ASCII
					ret += c;
				}
		}
	}
	
	return ret;
};

var writeComment = function (out, comment){
	comment = comment.split (/\r\n|\n/);
	comment.forEach (function (line){
		out.writeln (config.comment + line);
	});
};

properties.store = function (file, obj, args, cb){
	if (arguments.length === 3){
		cb = args;
		args = {};
	}
	
	var out = bw.open (file, {
		encoding: args.encoding,
		bufferSize: args.bufferSize
	}).on ("error", function (error){
		cb (error);
	});
	
	if (args.header){
		writeComment (out, args.header);
		out.line ();
	}
	
	var unicode = args.encoding === "ascii";
	
	var v;
	var s;
	var comment = false;
	for (var k in obj){
		v = obj[k];
		if (v === null || v === undefined){
			out.writeln (escape (k, true, unicode) + config.separator);
		}else{
			if (v.comment){
				comment = true;
				writeComment (out, v.comment);
			}
			out.write (escape (k, true, unicode) + config.separator);
			if (v.value){
				v = v.value;
			}else if (comment){
				v = null;
			}
			if (v !== null && v !== undefined){
				out.writeln (escape (v.toString () , false, unicode));
			}else if (comment){
				out.line ();
			}
		}
	}
	
	out.close (function (){
		cb (null);
	});
};