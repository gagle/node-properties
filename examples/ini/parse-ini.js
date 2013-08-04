"use strict";

var fs = require ("fs");
var properties = require ("../../lib");

var data = fs.readFileSync ("ini", { encoding: "utf8" });

var obj = properties.parse (data, { sections: true, comments: ";" });

console.log (obj);

/*
{
	server: {
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
		host: "localhost",
		port: 27017,
		min_pool: 10,
		max_pool: 100,
		timeout: 10000
	},
	i18n: {
		default: "en-US",
		cache: true,
		timeout: 3600000
	}
}
*/