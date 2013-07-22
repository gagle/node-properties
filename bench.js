"use strict";

var speedy = require ("speedy");
var pOld = require ("./lib_old/properties");
var pNew = require ("./lib");
var fs = require ("fs");

var data = fs.readFileSync ("./test/properties", { encoding: "utf8" });

speedy.run ({
	old: function (){
		pOld.parse (data);
	},
	"new": function (){
		pNew.parse (data, { data: true }, function (){});
	}
});

/*
File: bench.js

Node v0.10.13
V8 v3.14.5.9
Speedy v0.0.7

Benchmarks: 2
Timeout: 1000ms (1s 0ms)
Samples: 3
Total time per benchmark: ~3000ms (3s 0ms)
Total time: ~6000ms (6s 0ms)

Higher is better (ops/sec)

old
  12,069 ± 0.0%
new
  14,276 ± 0.3%

Elapsed time: 6091ms (6s 91ms)
*/