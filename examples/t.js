"use strict";

var util = require ("util");
var properties = require ("../lib");

var options = {
	path: true,
	json: true,
	namespaces: true
};

properties.parse ("a", options, function (error, p){
	if (error) return console.error (error);
	
	console.log (util.inspect (p, { depth: null }));
});*