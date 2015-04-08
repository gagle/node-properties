"use strict";

var properties = require ("../../lib");

var options = {
	path: true,
	variables: true,
	sections: true
};

properties.parse ("variables", options, function (error, p){
	if (error) return console.error (error);
	
	console.log (p);
	
	/*
	{
		domain1: "app1",
		domain2: "app2",
		users: {
			guest: "guest",
			admin: "gagle"
		},
		locales: {
			"en-US": "english",
			"es-ES": "spanish"
		},
		paths: {
			guest: "paths.guest",
			admin: "paths.gagle"
		},
		"paths.guest": {
			home: "some/path",
			logs: "some/path/logs/app1",
			conf: "some/path/conf/app1",
			locales_english: "some/path/locales/app2"
		},
		"paths.gagle": {
			home: "some/path",
			logs: "some/path/logs/app1",
			conf: "some/path/conf/app1",
			locales_spanish: "some/path/locales/app2"
		},
		permissions: {
			guest: "permissions.guest",
			admin: "permissions.gagle"
		},
		"permissions.guest": {
			"some/path": 400,
			"some/path/logs/app1": 400,
			"some/path/conf/app1": 400,
			"some/path/locales/app2": 400
		},
		"permissions.gagle": {
			"some/path": 755,
			"some/path/logs/app1": 777,
			"some/path/conf/app1": 400,
			"some/path/locales/app2": 700
		}
	}
	*/
});