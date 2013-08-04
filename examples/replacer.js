"use strict";

var properties = require ("../lib");

var stringifier = properties.stringifier ()
		.property ({ key: "a", value: 1 })
		.section ("a")
		.property ({ key: "a", value: 1 })
		.section ("b")
		.property ({ key: "a", value: 1 })
		.section ("c")
		.property ({ key: "a", value: 1 });

var options = {
	replacer: function (key, value, section){
		//The global property "a" is removed
		if (this.isProperty && !section && key === "a") return;
		
		//Section "a" is removed
		if (this.isSection && section === "a") return;
		
		//The value of the property "a" from the section "b" is modified
		if (this.isProperty && section === "b" && key === "a") return value + 1;
		
		//Returns the rest of the lines
		return this.assert ();
	}
};

var data = properties.stringify (stringifier, options);

console.log (data);

/*
[b]
a = 2

[c]
a = 1
*/