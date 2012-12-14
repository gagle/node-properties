properties
==========

_Node.js project_

#### .properties file parser ####

Version: 0.2.0

For reading and writing the properties a buffered reader and writer are used to reduce the memory footprint. The properties are case sensitive.

If you need advanced features like arguments replacement, INI sections and property expansion (keys as variables) take a look at [enhanced-properties](https://github.com/Gagle/Node-EnhancedProperties).

#### Installation ####

```
npm install properties
```

#### Example ####

```javascript
var properties = require ("properties");

properties.config ({
	comment: "# ",
	separator: " = "
});

var p = {
	p1: "v1",
	p2: null,
	p3: {
		comment: "A property",
		value: "v3"
	},
	p4: {
		comment: "An empty property\nwith multi-line comment"
	}
};

properties.store ("file", p, { header: "My multi-line\nproperties header" }, function (error){
	if (error) return console.log (error);
	properties.load ("file", function (error, p){
		if (error) return console.log (error);
		console.log (p);
		
		/*
		Prints:
		
		{
			p1: "v1",
			p2: null,
			p3: "v3",
			p4: null
		}
		*/
	});
```

file:

```text
# My multi-line
# properties header

p1 = v1
p2 = 
# A property
p3 = v3
# An empty property
# with multi-line comment
p4 = 
```

#### Methods ####

- [properties.config([settings])](#config)
- [properties.load(file[, settings], callback)](#load)
- [properties.store(file, p[, settings], callback)](#store)

<a name="config"></a>
__properties.config([settings])__  
Configures how comments and property separators must be written. The possible settings are:

- comment. _String_. The characters used to write comments. A valid comment must start with `#` or `!`. For example, `#<space>` is valid.
- separator. _String_. The characters used to separate keys from values. A valid separator can only contain spaces, tabs, form feeds (\f) and optionally only one `=` or `:`. For example, `<tab>=<space>` is valid.

<a name="load"></a>
__properties.load(file[, settings], callback)__  
Loads a .properties file. The callback receives the error and the loaded properties. The loaded properties is just a JavaScript object in literal notation.

The possible settings are:

- encoding. _String_. `ascii` or `utf8`. Default is `utf8`.
- bufferSize. _Number_. The buffer size used while reading the file. Default is 16KB.

```javascript
properties.load ("file", function (error, props){
	console.log (props.p1);
	console.log (props.p2);
	...
});
```

<a name="store"></a>
__properties.store(file, p[, settings], callback)__  
Stores a JavaScript object in literal notation -the properties- to a file. The callback receives a possible error.

All the non printable unicode characters ([C0 and C1 control codes](http://en.wikipedia.org/wiki/C0_and_C1_control_codes): 0-31 and 127-159) are converted to its unicode string representation, e.g. 0x00 (NUL) is converted to \u0000.

The properties can be null and can have comments. To write comments you must use an object with a `comment` property and optionally a `value` property to set the key's value. Some examples:

```javascript
var props = {
	a: "my value",
	b: null,
	c: {
		comment: "my comment",
		value: "my value"
	},
	d: {
		comment: "my comment",
		value: null
	},
	e: {
		comment: "my comment"
		//No value, the same as c
	},
	f: {
		//No comment, the same as a
		value: "my value"
	},
	g: {
		//No comment and no value, the same as b
	}
};
```

The possible settings are:
- encoding. _String_. `ascii` or `utf8`. If `ascii` is used, all the characters with code greater than 127 are converted to its unicode string representation.
- bufferSize. _Number_. The buffer size used while writin the file. Default is 16KB.
- header. _String_. A comment to write at the beginning of the file.

The comments (from properties and header) can be written as a multi-line comment, for example, if you write a property:

```javascript
a: {
	comment: "line 1\nline2"
	value: "b"
}
```

Then this will be written:

```text
#line 1
#line 2
a=b
```

The line separator could also be `\r\n`. Line separators are only used to split the comment, that is, if you're on Linux and write a comment `line1\r\nline2`, a `\n` will be used to write these lines.