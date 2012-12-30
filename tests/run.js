"use strict";

var Runner = require ("mocha-runner");

new Runner ({
	exclude: ["in", "sections", "ini", "expansion_no_sections",
			"expansion_sections"],
	tests: ["properties.js"]
}).run (function (error){
	if (error) console.log (error);
});