"use strict";

var Stringifier = require ("./stringifier");

module.exports = {
	parse: require ("./read"),
	stringify: require ("./write"),
	stringifier: function (o){
		if (o) return Stringifier.from (o);
		return new Stringifier ();
	}
};