"use strict";

var speedy = require ("speedy");
var properties = require ("../../lib");
var fs = require ("fs");

var jsonData = fs.readFileSync ("json", { encoding: "utf8" });
var propertiesData = fs.readFileSync ("properties", { encoding: "utf8" });
var options = { sections: true, namespaces: true };

speedy.run ({
	json: function (){
		JSON.parse (jsonData);
	},
	properties: function (){
		properties.parse (propertiesData, options);
	}
});

//Note: JSON.parse is written in native code by the people that made the V8
//engine!

/*
File: json-vs-properties.js

Node v0.10.20
V8 v3.14.5.9
Speedy v0.1.1

Tests: 2
Timeout: 1000ms (1s 0ms)
Samples: 3
Total time per test: ~3000ms (3s 0ms)
Total time: ~6000ms (6s 0ms)

Higher is better (ops/sec)

json
	566,540 ± 0.1%
properties
	35,311 ± 0.2%

Elapsed time: 6057ms (6s 57ms)
*/