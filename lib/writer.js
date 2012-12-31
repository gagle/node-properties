"use strict";

var EOL = process.platform === "win32" ? "\r\n" : "\n";

var Writer = module.exports = function (write, settings){
	this._maxKeyLength = 0;
	this._noMoreCalls = false;
	this._write = write;
	this._header = settings.header;
	
	if (Array.isArray (settings.replacer)){
		var included = {};
		settings.replacer.forEach (function (i){
			included[i] = null;
		});
		this._replacer = function (k, v, s){
			if (k === null){
				return s in included;
			}
			if (k in included) return v;
		};
	}else{
		this._replacer = settings.replacer;
	}
	
	this._pretty = settings.pretty;
	this._unicode = settings.unicode;
	this._sections = properties._config.sections;
	
	this._comment = settings.pretty
			? properties._config.comment.pretty
			: properties._config.comment.string;
	this._separator = settings.pretty
			? properties._config.separator.pretty
			: properties._config.separator.string;
};

var properties = require ("./properties");

var toUnicode = function (code){
	code = code.toString (16);
	while (code.length !== 4){
		code = "0" + code;
	}
	return "\\u" + code;
};

Writer.prototype._isComment = function (c){
	return c in properties._config.comment.allowed;
};

Writer.prototype._isSeparator = function (c){
	return c in properties._config.separator.allowed;
};

Writer.prototype._escape = function (s, space){
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
		
		if (c === " "){
				if (i === 0 || space){
					ret += "\\";
				}
				ret += " ";
		}else if (c === "\t"){
				ret += "\\";
				ret += "t";
		}else if (c === "\n"){
				ret += "\\";
				ret += "n";
		}else if (c === "\r"){
				ret += "\\";
				ret += "r";
		}else if (c === "\f"){
				ret += "\\";
				ret += "f";
		}else if (this._isComment (c) || this._isSeparator (c)){
				ret += "\\";
				ret += c;
		}else{
				if (code <= 31 || (code >= 127 && code <= 159)){
					//Unicode non printable characters (C0 and C1 control codes)
					ret += toUnicode (code);
				}else if (code > 160){
					//UTF8
					ret += this._unicode ? toUnicode (code) : c;
				}else{
					//ASCII
					ret += c;
				}
		}
	}
	
	return ret;
};

Writer.prototype._stringifyProperty = function (key, value){
	var me = this;

	var isEmpty = function (key, value){
		if (value === null || value === undefined){
			me._write (me._escape (key, true) + me._separator + EOL);
			return true;
		}
		return false;
	};
	
	var isSectionEmpty = function (value){
		return value === null || value === undefined;
	};
	
	var prettyKey = function (key){
		if (!me._pretty) return key;
		while (key.length < me._maxKeyLength){
			key += " ";
		};
		return key;
	};
	
	var prettyValue = function (keyLength, v){
		if (!me._pretty) return v;
		if (keyLength + v.length > 80){
			var limit = 75 - keyLength;
			var part = v.substring (0, limit) + "\\" + EOL;
			var i = 0;
			while (i !== keyLength + 3){
				i++;
				part += " ";
			}
			return part + prettyValue (keyLength, v.substring (limit));
		}
		return v;
	};

	if (isEmpty (key, value)) return;
	
	if (value.constructor === Object){
		var isMeta = "$comment" in value || "$value" in value ||
				!this._sections;
				
		if (!isMeta || "$comment" in value || "$value" in value ||
				Object.keys (value).length === 0){
			if (isMeta){
				this._writeComment (value.$comment);
				value = "$value" in value ? value.$value : null;
			}
			
			if (isEmpty (key, value)) return;
			
			var isSection = this._sections &&
					value.constructor === Object && !this._noMoreCalls;
			if (isSection){
				this._write ("[" + key + "]" + EOL);
				this._noMoreCalls = true;
				for (var k in value){
					if (this._replacer && !this._replacer (k, value[k], key)) continue;
					this._stringifyProperty (k, value[k]);
				}
				this._noMoreCalls = false;
				return;
			}
		}
	}
	
	key = prettyKey (this._escape (key, true));
	value = prettyValue (key.length, this._escape (value.toString (), false));
	
	this._write (key + this._separator + value + EOL);
};

Writer.prototype._writeComment = function (comment){
	if (!comment) return;
	
	var me = this;
	
	var prettyComment = function (comment){
		if (!me._pretty || (me._pretty && comment.length + 2 <= 80)){
			return me._comment + comment + EOL;
		}
		
		for (var i=77; i >= 0; i--){
			if (comment[i] === " ") break;
		}
		
		if (i > 0){
			return me._comment + comment.substring (0, i) + EOL +
					prettyComment (comment.substring (i + 1));
		}
		
		return me._comment + comment + EOL;
	};

	var splitComment = function (comment){
		var str = "";
		comment = comment.split (/\r\n|\n/);
		comment.forEach (function (line){
			str += prettyComment (line);
		});
		return str;
	};
	
	this._write (splitComment (comment));
};

Writer.prototype.stringify = function (obj){
	if (this._header){
		this._writeComment (this._header);
		this._write (EOL);
	}
	
	var me = this;
	var v;
	var isSection;
	var globalProps = [];
	if (this._sections) var sectionProps = [];
	var first = true;
	
	for (var k in obj){
		v = obj[k];
		isSection = this._sections && v !== null && v !== undefined &&
				((v.constructor === Object && "$value" in v && v.$value !== null &&
				v.$value !== undefined && v.$value.constructor === Object) ||
				(v.constructor === Object && !("$value" in v) && !("$comment" in v)));
				
		if (!isSection){
			if (this._pretty && k.length > this._maxKeyLength){
				this._maxKeyLength = k.length;
			}
			globalProps.push ({ k: k, v: v });
		}else{
			if (this._pretty){
				if ("$comment" in v || "$value" in v){
					v = v.$value;
				}
				for (k in v){
					if (k.length > me._maxKeyLength){
						me._maxKeyLength = k.length;
					}
				}
			}
			sectionProps.push ({ s: k, v: v });
		}
	}
	
	//JSON properties order is not guaranteed when the object is iterated,
	//so the global properties that doesn't belong to any section must be stored
	//first
	globalProps.forEach (function (p){
		if (me._replacer){
			p.v = me._replacer (p.k, p.v, null);
			if (p.v === undefined) return;
		}
		if (me._pretty){
			if (first){
				first = false;
			}else{
				me._write (EOL);
			}
		}
		me._stringifyProperty (p.k, p.v);
	});
	
	if (this._sections){
		sectionProps.forEach (function (p){
			if (me._replacer){
				if (!me._replacer (null, null, p.s)) return;
			}
			if (me._pretty){
				if (first){
					first = false;
				}else{
					me._write (EOL);
				}
			}
			me._stringifyProperty (p.s, p.v);
		});
	}
};