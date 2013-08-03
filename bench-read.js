"use strict";

var speedy = require ("speedy");
var pOld = require ("./lib/old/properties");
var pNew = require ("./lib");
var fs = require ("fs");

var data = fs.readFileSync ("./test/properties", { encoding: "utf8" });

speedy.run ({
	old: function (){
		pOld.parse (data);
	},
	"new": function (){
		pNew.parse (data);
	}
});

/*
File: bench-read.js

Node v0.10.15
V8 v3.14.5.9
Speedy v0.0.8

Benchmarks: 2
Timeout: 1000ms (1s 0ms)
Samples: 3
Total time per benchmark: ~3000ms (3s 0ms)
Total time: ~6000ms (6s 0ms)

Higher is better (ops/sec)

old
  11,332 ± 0.1%
new
  20,725 ± 0.2%

Elapsed time: 6141ms (6s 141ms)
*/