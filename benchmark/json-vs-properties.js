"use strict";

var speedy = require ("speedy");
var properties = require ("../lib");
var fs = require ("fs");

var jsonData = fs.readFileSync ("json", { encoding: "utf8" });
var propertiesData = fs.readFileSync ("properties", { encoding: "utf8" });

speedy.run ({
	json: function (){
		JSON.parse (jsonData);
	},
	properties: function (){
		properties.parse (propertiesData, { sections: true, json: true });
	}
});

//Note: JSON.parse is written in native by the people that made the V8 engine!

/*
File: json-vs-properties.js

Node v0.10.13
V8 v3.14.5.9
Speedy v0.0.8

Benchmarks: 2
Timeout: 1000ms (1s 0ms)
Samples: 3
Total time per benchmark: ~3000ms (3s 0ms)
Total time: ~6000ms (6s 0ms)

Higher is better (ops/sec)

json
  374,519 ± 0.0%
properties
  21,360 ± 0.2%

Elapsed time: 6131ms (6s 131ms)
*/