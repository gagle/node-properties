var Properties = require ("../build/properties").Properties;

var properties = new Properties ();
properties
	.set ("p1", "v1", "Property 1")
	.set ("p2", null, "Property 2, empty")
	.set ("p3", "v3")
	.set ("p4", null)
	.store ("example.properties", "Example .properties file", function (error, stored){
		console.log ("stored: " + stored);
		
		properties = new Properties ();
		properties.load ("example.properties", function (error, loaded){
			console.log ("loaded: " + loaded);
			
			var keys = properties.keys ();
			console.log ("keys: " + keys);
			keys.forEach (function (key){
				console.log (key + ":" + properties.get (key));
			});
		});
	});