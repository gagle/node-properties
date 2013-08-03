"use strict";

var speedy = require ("speedy");
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

//Note: JSON.stringify is written in native code by the people that made the V8
//engine!

speedy.run ({
	json: function (){
		JSON.stringify (o);
	},
	properties: function (){
		properties.stringify (stringifier);
	}
});

/*
File: json-vs-properties.js

Node v0.10.15
V8 v3.14.5.9
Speedy v0.0.8

Benchmarks: 2
Timeout: 1000ms (1s 0ms)
Samples: 3
Total time per benchmark: ~3000ms (3s 0ms)
Total time: ~6000ms (6s 0ms)

Higher is better (ops/sec)

json
  610,551 ± 0.1%
properties
  428,595 ± 0.0%

Elapsed time: 6150ms (6s 150ms)
*/