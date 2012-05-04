var Properties = require ("../build/properties");

new Properties ()
	.set ("p1", "v1", "Property 1")
	.set ("p2", null, "Property 2, empty")
	.set ("p3", "v3")
	.set ("p4", null)
	.store ("example.properties", "Example .properties file", function (error){
		new Properties ().load ("example.properties", function (error){
			var me = this;
			var keys = this.keys ();
			console.log ("keys: " + keys);
			keys.forEach (function (key){
				console.log (key + ":" + me.get (key));
			});
		});
	});