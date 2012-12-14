"use strict";

var Runner = require ("mocha-runner");

new Runner ({
	exclude: ["in"],
	tests: ["properties.js"]
}).run (function (error){
	if (error) console.log (error);
});