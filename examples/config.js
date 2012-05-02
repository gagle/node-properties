var Properties = require ("../build/properties");

Properties.COMMENT = "# ";
Properties.SEPARATOR = " =	";

new Properties ()
	.set ("p1", "v1", "Comment 1")
	.set ("p2", "v2", "Comment 2")
	.store ("file");