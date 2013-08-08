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
			text1: "Hello"
		},
		es: {
			text1: "Hola"
		},
		de: {
			text1: "Hallo"
		}
	}
	*/
});