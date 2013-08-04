"use strict";

var util = require ("util");
var properties = require ("../../lib");

var options = {
	path: true,
	variables: true,
	json: true,
	sections: true,
	namespaces: true
};

properties.parse ("namespaces", options, function (error, p){
	if (error) return console.error (error);
	
	console.log (util.inspect (p, { depth: null }));
	
	/*
	{
		app: {
			name: "App",
			version: "0.0.1",
			title: "App v0.0.1"
		},
		path: {
			home: "./app",
			test: "./app/test",
			web: "./app/web"
		},
		log: {
			basename: "app",
			max_size: "1kb",
			type: "cycle",
			backups: 1
		},
		db: {
			host: "10.10.10.10",
			port: 1234,
			pool: {
				min: 5,
				max: 10
			}
		},
		cool: {
			things: {
				array: ["10.10.10.10", 1234, "string", 123],
				object: {
					array: ["10.10.10.10", 1234, "string", 123]
				}
			}
		}
	}
	*/
});