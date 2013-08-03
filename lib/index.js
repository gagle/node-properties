"use strict";

var Stringifier = require ("./stringifier");

module.exports = {
	parse: require ("./read"),
	stringify: require ("./write"),
	stringifier: function (){
		return new Stringifier ();
	}
};