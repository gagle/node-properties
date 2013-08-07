"use strict";

var speedy = require ("speedy");
var fs = require ("fs");
var ini = require ("ini");
var properties = require ("../../lib");

var data = fs.readFileSync ("properties", { encoding: "utf8" });
var options = {
	sections: true,
	comments: ";",
	separators: "=",
	strict: true
};

speedy.run ({
	ini: function (){
		ini.parse (data);
	},
	properties: function (){
		properties.parse (data, options);
	}
});

/*
File: ini-vs-properties.js

Node v0.10.15
V8 v3.14.5.9
Speedy v0.0.8

Benchmarks: 2
Timeout: 1000ms (1s 0ms)
Samples: 3
Total time per benchmark: ~3000ms (3s 0ms)
Total time: ~6000ms (6s 0ms)

Higher is better (ops/sec)

ini
  31,797 ± 0.2%
properties
  43,560 ± 0.0%

Elapsed time: 6061ms (6s 61ms)
*/