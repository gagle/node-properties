var Properties = require ("../build/properties");

Properties.SENSITIVITY = false;

new Properties ()
	.set ("p1", "v1")
	.set ("P1", "v2")
	.store ("outFile");

new Properties ().load ("inFile", function (){
	console.log (this.keys ()); //Prints: ['p1']
	console.log (this.get ("P1")); //Prints: v2
});