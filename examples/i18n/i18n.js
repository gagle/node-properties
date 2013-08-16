"use strict"

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
		en: {
			id0: "Hello"
		},
		es: {
			id0: "Hola"
		},
		de: {
			id0: "Hallo"
		}
	}
	*/
});