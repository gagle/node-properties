"use strict";

var Builder = module.exports = function (){
	this._header = null;
	this._lines = [];
};

Builder.prototype.header = function (comment){
	this._header = comment;
	return this;
};

Builder.prototype.property = function (p){
	p = p || {};
	p.property = true;
	this._lines.push (p);
	return this;
};

Builder.prototype.section = function (p){
	if (typeof p === "string"){
		p = { name: p };
	}else{
		p = p || {};
	}
	p.section = true;
	this._lines.push (p);
	return this;
};