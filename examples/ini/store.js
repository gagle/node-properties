"use strict";

var fs = require ("fs");

var properties = require ("../../lib/properties");

var replacer = function (key, value, section){
	if (key === null){
		//Section found, all sections are added except private_section
		return section !== "private_section" ? section : undefined;
	}
	
	//All the keys are stored except private_key
	if (key !== "private_key") return value;
};

var config = {
	//Enables the sections
	sections: true,
	//Character used to write comments
	comment: ";",
	//The output is pretty printed
	pretty: true,
	//Called for every property and section
	replacer: replacer
};

var p = {
	private_section: {
		my_secret: "secret_thing"
	},
	web: {
		$comment: "Web server instance",
		$value: {
			host: "localhost",
			port: 8080
		}
	},
	paths: {
		$comment: "Default paths, relative from paths.home",
		$value: {
			home: "../",
			conf: {
				$comment: "Configuration files",
				$value: "conf"
			},
			logs: {
				$comment: "System logs",
				$value: "logs"
			},
			src: {
				$comment: "Source files",
				$value: "src"
			},
			build: {
				$comment: "Built files",
				$value: "build"
			},
			locales: {
				$comment: "Internationalization resources",
				$value: "locales"
			},
			docs: {
				$comment: "Documentation",
				$value: "docs"
			}
		}
	},
	private_key: "ABCD-1234-EFGH-5678",
	//This key will be stored at the very first line because it doesn't belong
	//to any section
	public_key: "1234-ABCD-5678-EFGH"
};

properties.store (__dirname + "/out", p, config, function (error){
	if (error) return console.log (error);
	
	console.log (fs.readFileSync (__dirname + "/out", "utf8"));
	
	/*
		Prints:

		public_key  = 1234-ABCD-5678-EFGH

		; Web server instance
		[web]
		host        = localhost
		port        = 8080

		; Default paths, relative from paths.home
		[paths]
		home        = ../
		; Configuration files
		conf        = conf
		; System logs
		logs        = logs
		; Source files
		src         = src
		; Built files
		build       = build
		; Internationalization resources
		locales     = locales
		; Documentation
		docs        = docs
	*/
});

