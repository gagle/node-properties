"use strict";

var speedy = require ("speedy");
var fs = require ("fs");
var ini = require ("ini");
var properties = require ("../../lib");

var propertiesData = fs.readFileSync ("properties", { encoding: "utf8" });
var iniData = fs.readFileSync ("ini", { encoding: "utf8" });
var options = {
	sections: true,
	comments: ";",
	separators: "=",
	strict: true
};

speedy.run ({
	ini: function (){
		ini.parse (iniData);
	},
	properties: function (){
		properties.parse (propertiesData, options);
	}
});

/*
File: ini-vs-properties.js

Node v0.10.20
V8 v3.14.5.9
Speedy v0.1.1

Tests: 2
Timeout: 1000ms (1s 0ms)
Samples: 3
Total time per test: ~3000ms (3s 0ms)
Total time: ~6000ms (6s 0ms)

Higher is better (ops/sec)

ini
	33,748 ± 0.1%
properties
	48,337 ± 0.1%

Elapsed time: 6070ms (6s 70ms)
*/