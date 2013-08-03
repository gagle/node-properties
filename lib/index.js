"use strict";

var Builder = require ("./builder");

module.exports = {
	parse: require ("./read"),
	stringify: require ("./write"),
	builder: function (){
		return new Builder ();
	}
};