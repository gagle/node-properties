"use strict";

var speedy = require ("speedy");
var yaml = require ("js-yaml");
var properties = require ("../../lib");

var o = {
	s1: "v",
	s2: "v",
	s3: "v",
	s4: "v",
	s5: "v",
	n1: 1,
	n2: 1,
	n3: 1,
	n4: 123.123,
	n5: 123.123,
	n6: 123.123
};

var stringifier = properties.stringifier (o);

speedy.run ({
	yaml: function (){
		yaml.safeDump (o);
	},
	properties: function (){
		properties.stringify (stringifier);
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
  45,817 ± 0.4%
properties
  426,769 ± 0.1%

Elapsed time: 6146ms (6s 146ms)
*/