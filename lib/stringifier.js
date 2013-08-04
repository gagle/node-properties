"use strict";

var Stringifier = module.exports = function (){
	this._header = null;
	this._lines = [];
};

Stringifier.from = function (o){
	var stringifier = new Stringifier ();

	//Cannot contains sections
	//Warning! Numeric keys are iterated before any other key
	for (var p in o){
		stringifier.property ({ key: p, value: o[p] });
	}
	
	return stringifier;
};

Stringifier.prototype.header = function (comment){
	this._header = comment;
	return this;
};

Stringifier.prototype.property = function (p){
	p.property = true;
	this._lines.push (p);
	return this;
};

Stringifier.prototype.section = function (p){
	if (typeof p === "string"){
		p = { name: p };
	}
	p.section = true;
	this._lines.push (p);
	return this;
};