"use strict";

var properties = require ("../../lib");

var options = {
	path: true,
	include: true,
	sections: true
};

properties.parse (".", options, function (error, p){
	if (error) return console.error (error);
	
	console.log (p);
	
	/*
	{
		web: {
			hostname: "10.10.10.10",
			port: 1234
		},
		db: {
			hostname: "10.10.10.20",
			port: 4321
		}
	}
	*/
});