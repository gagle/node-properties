"use strict";

var properties = require ("../../lib/properties");

var config = {
	//Enables the sections
	sections: true,
	//A space character will be used as a separator between keys and values
	separator: " "
};

var p = {
	colour: {
		r: 255,
		g: 255,
		b: 255
	},
	user: {
		name: "John Doe",
		age: "10"
	},
	big: true
};

var str = properties.stringify (p, config);

console.log (str);

/*
Prints:

big true
[colour]
r 255
g 255
b 255
[user]
name John Doe
age 10
*/

console.log (properties.parse (str, config));

/*
Prints:

{
	big: true,
	colour: {
		r: 255,
		g: 255,
		b: 255
	},
	user: {
		name: John Doe,
		age: 10
	}
}
*/