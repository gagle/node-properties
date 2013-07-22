"use strict";

var events = require ("events");
var util = require ("util");

module.exports.create = function (data, settings){
	return new Reader (data, settings);
};

var Reader = function (data, settings){
	events.EventEmitter.call (this);
	
	var me = this;
	
	var comments = settings.comments || [];
	this._comments = {};
	comments.forEach (function (comment){
		me._comments[comment] = true;
	});
	
	var separators = settings.separators || [];
	this._separators = {};
	separators.forEach (function (separator){
		me._separators[separator] = true;
	});
	
	this._abort = false;
	
	process.nextTick (function (){
		me._parse (data);
	});
};

util.inherits (Reader, events.EventEmitter);

Reader.prototype._isComment = function (c){
	//User defined comment tokens
	return !!this._comments[c];
};

Reader.prototype._isSeparator = function (c){
	//User defined separator tokens
	return !!this._separators[c];
};

Reader.prototype._parse = function (data){
	var c;
	var escape;
	var skipSpace = true;
	var isCommentLine;
	var newLine = true;
	var multiLine;
	var isKey = true;
	var key = "";
	var value = "";
	var unicode;
	var unicodeRemaining;
	var escapingUnicode;
	var keySpace;
	var sep;
	
	var me = this;
	
	var line = function (){
		if (key || value || sep){
			me.emit ("line", key, value);
			key = "";
			value = "";
			sep = false;
		}
	};
	
	var escapeString = function (key, c){
		if (escapingUnicode && unicodeRemaining){
			unicode += c;
			if (--unicodeRemaining) return key;
			escape = false;
			escapingUnicode = false;
			return key + String.fromCharCode (parseInt (unicode[0] + unicode[1] +
					unicode[2] + unicode[3], 16));
		}
		
		if (c === "u"){
			unicode = "";
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
		if (this._abort) return;
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
			if (c === "#" || c === "!" || this._isComment (c)){
				isCommentLine = true;
				continue;
			}
		}
		
		if (c !== "\n"){
			if (!escape && (c === "=" || c === ":" || this._isSeparator (c))){
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
			
			if (c === "\\"){
				if (escape){
					if (isKey) key += "\\";
					else value += "\\";
				}
				escape = !escape;
			}else{
				if (isKey){
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
				newLine = true;
				skipSpace = true;
				isKey = true;
				
				line ();
			}
		}
	}
	
	line ();
	
	this.emit ("end");
};

Reader.prototype.abort = function (){
	this._abort = true;
};