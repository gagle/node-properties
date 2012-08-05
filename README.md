<a name="start"></a>

Node Properties
===============

#### A Java .properties file parser ported to node.js ####

[Show me!](#showme) | [Availability](#availability) | [Compatibility](#compatibility) | [Documentation](#documentation)

Version: 0.1.13

<a name="showme"></a>
#### Show me! [↑](#start) ####

```javascript
var Properties = require ("properties");

new Properties ()
	.set ("p1", "v1", "Property 1")
	.set ("p2", null, "Property 2, empty")
	.set ("p3", "v3")
	.set ("p4", null)
	.store ("example.properties", "Example .properties file", function (error){
		new Properties ().load ("example.properties", function (error){
			var me = this;
			var keys = this.keys ();
			console.log ("keys: " + keys); //Prints: keys: p1,p2,p3,p4
			keys.forEach (function (key){
				console.log (key + ":" + me.get (key));
			});
			/*
			Prints: 
			p1:v1
			p2:null
			p3:v3
			p4:null
			*/
		});
	});
```

example.properties:

```text
#Example .properties file
#Property 1
p1=v1
#Property 2, empty
p2=
p3=v3
p4=
```

***

<a name="availability"></a>
#### Availability [↑](#start) ####

Via npm:

```
npm install properties
```

***

<a name="compatibility"></a>
#### Compatibility [↑](#start) ####

✔ Node 0.4.10+

***

<a name="documentation"></a>
#### Documentation [↑](#start) ####
 
[Reference](https://github.com/Gagle/Node-Properties/wiki/Reference)  
[Examples](https://github.com/Gagle/Node-Properties/tree/master/examples)  
[Change Log](https://github.com/Gagle/Node-Properties/wiki/Change-Log)  
[MIT License](https://github.com/Gagle/Node-Properties/blob/master/LICENSE)