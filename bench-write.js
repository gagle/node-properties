"use strict";

var speedy = require ("speedy");
var pOld = require ("./lib/old/properties");
var pNew = require ("./lib");
var fs = require ("fs");

var data = fs.readFileSync ("./test/properties", { encoding: "utf8" });
var o = {
    a: "a value",
    b: null,
    c: {
        $comment: "c comment",
        $value: "c value"
    },
    d: {
        $comment: "d comment",
        $value: null
    },
    g: {},
    h: {
        $comment: "h section",
        $value: {
            a: "a value",
            b: {
                $comment: "b comment",
                $value: "b value"
            }
        }
    }
};

var builder = pNew.builder ()
		.header ("a\nb\n")
		.property ({ key: "a", value: "a value" })
		.property ({ key: "b" })
		.property ({ comment: "c comment", key: "c", value: "c value" })
		.property ({ comment: "d comment", key: "d" })
		.section ()
		.section ({ comment: "h section", name: "h" })
		.property ({ key: "a", value: "a value" })
		.property ({ comment: "b comment", key: "b", value: "b value" });


speedy.run ({
	old: function (){
		pOld.stringify (o, { header: "a\nb\n", sections: true });
	},
	"new": function (){
		pNew.stringify (builder);
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
  80,140 ± 0.4%
new
  355,202 ± 0.0%

Elapsed time: 6140ms (6s 140ms)
*/