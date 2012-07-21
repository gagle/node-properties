var Properties = require ("../build/properties");

Properties.SENSITIVITY = false;

new Properties ()
	.set ("P1", "v1", "Comment 1")
	.set ("p1", null, "This property won't be written to the file")
	.store ("outFile");

new Properties ().load ("inFile", function (){
	console.log (this.keys ()); //['P1']
});