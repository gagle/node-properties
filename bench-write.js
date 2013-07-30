"use strict";

var speedy = require ("speedy");
var pOld = require ("./lib/old/properties");
var pNew = require ("./lib");
var fs = require ("fs");

var data = fs.readFileSync ("./test/properties", { encoding: "utf8" });

speedy.run ({
	old: function (){
		pOld.stringify ({}, { header: "a\nb\n" });
	},
	"new": function (){
		pNew.stringify ({}, { header: "a\nb\n" });
	}
});

/*
File: bench-write.js

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
  362,241 ± 0.0%
new
  3,353,011 ± 0.0%

Elapsed time: 6162ms (6s 162ms)
*/