"use strict";

var speedy = require ("speedy");
var yaml = require ("js-yaml");
var properties = require ("../../lib");
var fs = require ("fs");

var propertiesData = fs.readFileSync ("properties", { encoding: "utf8" });
var yamlData = fs.readFileSync ("yaml", { encoding: "utf8" });
var options = { sections: true, namespaces: true };

speedy.run ({
	yaml: function (){
		yaml.safeLoad (yamlData);
	},
	properties: function (){
		properties.parse (propertiesData, options);
	}
});

/*
File: yaml-vs-properties.js

Node v0.10.20
V8 v3.14.5.9
Speedy v0.0.8

Benchmarks: 2
Timeout: 1000ms (1s 0ms)
Samples: 3
Total time per benchmark: ~3000ms (3s 0ms)
Total time: ~6000ms (6s 0ms)

Higher is better (ops/sec)

yaml
  20,551 ± 0.7%
properties
  35,885 ± 0.3%

Elapsed time: 6146ms (6s 146ms)
*/