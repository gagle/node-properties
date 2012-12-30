properties
==========

_Node.js project_

#### Properties file parser ####

Version: 0.3.0

The module implements the Java properties specification and gives to you a powerful set of features that can be enabled or disabled at any time. Json files can be used to store complex data structures such as arrays or nested objects, but if you only want to save some properties, e.g. the database uri connection and credentials, valid json objects require a lot of metadata: curly braces, colons, commas and especially a lot of double quotes. Compare this two versions:

```text
c = 1
[a]
a = 1
[b]
b = 1
```

```javascript
{
	"a": {
		"a": "1"
	},
	"b": {
		"b": "1"
	},
	"c": "1"
}
```

Which do you prefer? Which is more readable? Can you write comments in json files?

The stringified properties are parsed the right way, reading character by character instead of reading lines, splitting, using regular expressions and all the easy to implement but slow techniques.

There are several additional features you can use, some of them are: sections, variables, define your custom comment and key-value separator characters, replacers and revivers similar to the json functions, pretty print the stringified properties, convert special characters to their unicode string representation, write comments, parse/stringify INI files and much more.

The disk access is buffered to reduce the memory footprint. The default buffer size is 16KB, a quite large for a simple properties file. Most often you'll have small files (less than 1KB, maybe 2KB), so a single I/O call will be done, but it's better to support buffering, just in case. If you prefer, you can avoid the buffers usage and work with strings with the [parse()](#parse) and [stringify()](#stringify) functions, so you decide how to do the I/O access -typically you'll use fs.readFile() and fs.writeFile()- 

The properties are case sensitive.

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
		$comment: "A property",
		$value: "v3"
	},
	p4: {
		$comment: "An empty property\nwith multi-line comment"
	}
};

properties.store ("file", p, { header: "My header" }, function (error){
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
# My header

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
- [properties.parse(str[, settings])](#parse)
- [properties.store(file, obj[, settings], callback)](#store)
- [properties.stringify(obj[, settings])](#stringify)

<a name="config"></a>
__properties.config([settings])__  
Configures how comments and property separators must be written. This is an optional configuration. By default, comments are written with a `#` and keys-values are separated with an `=`. The possible settings are:

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
__properties.store(file, obj[, settings], callback)__  
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
		//No value, the same as d
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
- encoding. _String_. `ascii` or `utf8`. If `ascii` is used, all the characters with code greater than 127 are converted to its unicode string representation. Default is `utf8`.
- bufferSize. _Number_. The buffer size used while writing the file. Default is 16KB.
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