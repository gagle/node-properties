var Properties = require ("../../build/properties");

new Properties ()
	.set ("↑", "↓")
	.set ("←", "→")
	.store ("tmp", function (error){
		if (error) console.log (error);
	});