"use strict";

var util = require ("util");
var properties = require ("../../lib/properties");

var reviver = function (key, value, section){
	//We want to convert the dotted sections to nested json objects (namespaces)
	
	if (key === null){
		//Section found
		var holder = myProps;
		section.split (".").forEach (function (o){
			if (!(o in holder)){
				holder[o] = {};
			}
			holder = holder[o];
		});
		return section;
	}
	
	var holder = myProps;
	if (section !== null){
		section.split (".").forEach (function (o){
			holder = holder[o];
		});
	}
	holder[key] = value;
	return value;
};

var config = {
	//Enables the sections
	sections: true,
	//Called for every property and section
	reviver: reviver
};

var myProps = {};

properties.load (__dirname + "/namespaces", config, function (error, p){
	if (error) return console.log (error);
	console.log (p);
	console.log (util.inspect (myProps, true, null));
	
	/*
	Prints (p):
	
	{
		l: 0,
		a: {
			l: 1
		},
		"a.b": {
			l: 2
		},
		"a.b.c": {
			l: 3
		}
	}
	
	
	Prints (myProps):
	
	{
		a: {
			l: 1,
			b: {
				c: {
					l: 3
				},
				l: 2
			}
		},
		l: 0
	}
	*/
});