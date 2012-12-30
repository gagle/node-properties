"use strict";

var properties = require ("../../lib/properties");

properties.config ({
	//Enables the sections
	sections: true,
	//Allowed character comments: #, ! (default) and ;
	allowedComments: [";"]
});

//The reviver is called for every property and section
var reviver = function (key, value, section){
	if (key === null){
		//Section found, all sections are added
		return section;
	}
	
	//All the properties are added except timestamp
	if (key !== "timestamp") return value;
};

properties.load ("ini", { reviver: reviver },
		function (error, p){
	if (error) return console.log (error);
	console.log (p);
	
	/*
	Prints:
	
	{
		app: {
			name: "MyApp",
			version: "0.0.1"
		},
		web: {
			host: "localhost",
			port: 8080,
			log: "web.log"
		},
		session: {
			secret: "brainfuck",
			key_id: "sid",
			max_age: 31536000000
		},
		database: {
			user: "root",
			password: "mypass",
			host: "localhost",
			port: 27017,
			min_pool: 10,
			max_pool: 100,
			timeout: 10000,
			log: "db.log"
		},
		i18n: {
			default: "en-US",
			file_extension: ".lang",
			cache: true,
			timeout: 3600000
		}
	}
	*/
});