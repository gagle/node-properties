"use strict";

var speedy = require ("speedy");
var ini = require ("ini");
var yaml = require ("js-yaml");
var properties = require ("../lib");

var o = {
	s1: "string",
	s2: "string",
	s3: "string",
	n1: 123,
	n2: 123,
	n3: 123,
	n4: 123.123,
	n5: 123.123,
	n6: 123.123
};

//Note: JSON.stringify is written in native code by the people that made the V8
//engine!

speedy.run ({
	ini: function (){
		ini.stringify (o);
	},
	json: function (){
		JSON.stringify (o);
	},
	properties: function (){
		properties.stringify (o);
	},
	yaml: function (){
		yaml.safeDump (o);
	},
});

/*
File: stringify.js

Node v0.10.20
V8 v3.14.5.9
Speedy v0.0.8

Benchmarks: 4
Timeout: 1000ms (1s 0ms)
Samples: 3
Total time per benchmark: ~3000ms (3s 0ms)
Total time: ~12000ms (12s 0ms)

Higher is better (ops/sec)

ini
  220,071 ± 0.1%
json
  688,354 ± 0.0%
properties
  555,186 ± 0.1%
yaml
  52,581 ± 0.1%

Elapsed time: 12292ms (12s 292ms)
*/