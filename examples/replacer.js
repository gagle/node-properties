"use strict";

var properties = require ("../lib");

var stringifier = properties.stringifier ()
		.property ({ key: "a", value: 1 })
		.section ("s1")
		.property ({ key: "a", value: 1 })
		.section ("s2")
		.property ({ key: "a", value: 1 })
		.section ("s3")
		.property ({ key: "a", value: 1 });

var options = {
	replacer: function (key, value, section){
		//The global property "a" is removed
		if (this.isProperty && !section && key === "a") return;
		
		//Section "a" is removed
		if (this.isSection && section === "s1") return;
		
		//The value of the property "a" from the section "b" is modified
		if (this.isProperty && section === "s2" && key === "a") return value + 1;
		
		//Returns the rest of the lines
		return this.assert ();
	}
};

var data = properties.stringify (stringifier, options);

console.log (data);

/*
[s2]
a = 2

[s3]
a = 1
*/