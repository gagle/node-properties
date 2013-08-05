"use strict";

var properties = require ("../../lib");

var options = {
	path: true,
	variables: true,
	vars: {
		A: "external var"
	}
};

properties.parse ("vars", options, function (error, p){
	if (error) return console.error (error);
	
	console.log (p);
	
	/*
	{
		a: "internal var",
		b: "internal var", 
		c: "external var"
	}
	*/
});