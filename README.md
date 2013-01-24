properties
==========

_Node.js project_

#### .properties parser/stringifier ####

Version: 0.3.3

This module implements the Java .properties specification and gives to you a powerful set of features that can be enabled. Json files can be used to store complex data structures such as arrays or nested objects, but if you only want to save some properties, e.g. the database uri connection and credentials, valid json files can become a bit overloaded due to the metadata characters: curly braces, colons, commas and especially a lot of double quotes. Compare these two versions:

```text
a = x
[s1]
b = y
[s2]
c = z
```

```javascript
{
	"a": "x",
	"s1": {
		"b": "y"
	},
	"s2": {
		"c": "z"
	}
}
```

Which do you prefer? Which is more readable? Can you write comments in json files?

The properties are parsed the right way, reading character by character instead of reading lines, splitting them, using regular expressions and all the easy to implement but slow techniques.

There are several additional features you can use, some of them are: sections, variables, define your custom comment and key-value separator characters, replacers and revivers similar to the json callbacks, pretty print the stringified properties, convert special characters to their unicode string representation, write comments, parse/stringify INI files and much more.

The disk access is buffered to reduce the memory footprint. The default buffer size is 16KB, a quite large for a simple properties file. Most often you'll have small files (less than 1KB, maybe 2KB), so a single I/O call will be done, but it's better to support buffering, just in case. If you prefer, you can avoid the buffers and work with strings with the [parse()](#parse) and [stringify()](#stringify) functions, so you decide how to do the I/O access -typically you'll use fs.readFile() and fs.writeFile()-. 

The properties are case sensitive.

#### Installation ####

```
npm install properties
```

#### Example ####

```javascript
var properties = require ("properties");

var config = {
	comment: "# ",
	separator: " = ",
	sections: true
};

var p = {
	p1: "v1",
	p2: null,
	p3: {
		$comment: "A property",
		$value: "v3"
	},
	p4: {
		$comment: "An empty property\nwith multi-line comment"
	},
	s1: {
		p1: 1,
		p2: 2
	}
};

properties.store ("file", p, config, function (error){
	if (error) return console.log (error);
	properties.load ("file", config, function (error, p){
		if (error) return console.log (error);
		console.log (p);
		
		/*
		Prints:
		
		{
			p1: "v1",
			p2: null,
			p3: "v3",
			p4: null,
			s1: {
				p1: 1,
				p2: 2
			}
		}
		*/
	});
});
```

file:

```text
p1 = v1
p2 = 
# A property
p3 = v3
# An empty property
# with multi-line comment
p4 = 
[s1]
p1 = 1
p2 = 2
```

#### Features ####

##### Sections #####

To add a section just write:

`[<name>]`

Example:

`[My Section]`

Additional information:

* The keys next to a section header will belong to that section.
* Different sections can have keys with the same name.
* The keys added before the first section are considered global and don't belong to any section.
* It's not possible to nest sections inside other sections.
* A duplicate section replaces the previous section with the same name, they are not merged.

Sections are disabled by default.

##### Variables #####

To get the value of a key:

```text
a = 1
b = ${a}
```

The value of `b` will be `1`.

Take into account that the keys can belong to sections. In the previous example, `a` and `b` are global properties. To reference a key within a section just prefix the section followed by a `|`. Example:

```text
a = 1
[s1]
a = 2
[s2]
a = 3
b = ${a}${s1|a}${s2|a}
```

The value of `b` will be `123`.

You can also nest variables inside other variables, in other words, you can create variables dynamically. Example:

```text
[s1]
a = 12
[s2]
123 = a
b = ${s2|${s1|a}3}
```

The value of `b` will be `a`.

You can use a variable anywhere. Look at the [examples](https://github.com/Gagle/Node-Properties/tree/master/examples/variables) to see what you can do with variables.

Variables are disabled by default.

##### Customize tokens #####

You can also add new characters that can be used to write comments or to separate keys from values. For example, we want to parse a text that uses `;` to write comments:

```javascript
properties.parse (text, { comments: [";"] });
```

The .properties specification says that `#` and `!` can be used to write comments. These characters will always be allowed, so the `comments` property adds `;` to the valid set of tokens.

Similarly, you can add new characters that are parsed as a key-value separator:

```javascript
properties.parse (text, { separators: ["-", ">"] });
```

`comments` and `separators` are used when parsing strings. If you want to stringify an object and write comments with `; ` and separators with ` - ` you have to use `comment` and `separator` properties:

```javascript
properties.stringify (text, { comment: "; ", separator: " - " });
```

Take into account that `comment` and `separator` can contain blank spaces (space, \t or \f) but `comments` and `separators` properties expect an array of single characters.

##### INI files #####

If you enable the sections and add `;` to the set of valid comment characters, this module can also parse and stringify INI files:

```javascript
properties.parse (text, {
	sections: true,
	comments: [";"]
});

properties.stringify (obj, {
	sections: true,
	comment: "; "
});
```

#### Methods ####

- [properties.load(file[, settings], callback)](#load)
- [properties.parse(str[, settings])](#parse)
- [properties.store(file, obj[, settings], callback)](#store)
- [properties.stringify(obj[, settings])](#stringify)

<a name="load"></a>
__properties.load(file[, settings], callback)__  
Loads a file. The callback receives the error and the loaded properties. The loaded properties are just a JavaScript object in literal notation. The access to the file is buffered.

The possible settings are:

- encoding. _String_. `ascii` or `utf8`. Default is `utf8`.
- bufferSize. _Number_. The buffer size used while reading the file. Default is 16KB.
- comments. _Array_. An array of characters that are used to parse comments. `#` and `!` are always considered comment tokens.
- separators. _Array_. An array of characters that are used to parse key-value separators. `=`, `:` and `<blank space>` are always considered separator tokens.
- sections. _Boolean_. Enables the sections. Default is false.
- variables. _Boolean_. Enables the variables. Default is false.
- reviver. _Function_. Callback executed for each property and section. Its funcionality is similar to the json reviver callback. The reviver receives two parameters, the key and the value. The returned value will be stored in the final object. If the function returns undefined the property is not added. If sections are enabled the reviver receives a third parameter, the section. When a section is found, the key and the value are set to null. The returned value will be used to set section's name, if it's undefined the section is not added.

  For example, a reviver that does nothing:
	
	file:
	
	```text
	a = 1
	[section1]
	a = 1
	[section2]
	a = 1
	```

	```javascript
	var reviver = function (key, value, section){
		console.log (key, value, section);
		
		/*
		Prints:
		
		a 1 null
		null null section1
		a 1 section1
		null null section2
		a 1 section2
		*/
		
		if (key === null){
			//Section found
			return section;
		}
		return value;
	}
	
	properties.load ("file", { reviver: reviver, sections: true }, function (error, props){
		console.log (props);
		
		/*
		Prints:
		
		{
			a: 1,
			section1: {
				a: 1
			},
			section2: {
				a: 1
			}
		}
		*/
	});
	```

<a name="parse"></a>
__properties.parse(str[, settings])__  
Does the same as [load()](#load) but does not perform any I/O access, the input is the given string. The function can throw exceptions when then variables are enabled, otherwise is not necessary to wrap it with a try-catch.

<a name="store"></a>
__properties.store(file, obj[, settings], callback)__  
Stores a JavaScript object in literal notation -the properties- to a file. The callback receives a possible error.

All the non printable unicode characters ([C0 and C1 control codes](http://en.wikipedia.org/wiki/C0_and_C1_control_codes): 0-31 and 127-159) are converted to its unicode string representation, e.g. 0x00 (NUL) is converted to \u0000.

The properties can be null and can have comments. To write comments you must use an object with a `$comment` and `$value` properties. Some examples:

```javascript
var props = {
	a: "a value",
	b: null,
	c: {
		$comment: "c comment",
		$value: "c value"
	},
	d: {
		$comment: "d comment",
		$value: null
	},
	e: {
		$comment: "e comment"
		//No value, the same as d
	},
	f: {
		//No comment, the same as a
		$value: "f value"
	},
	g: {
		//No comment and no value, the same as b if sections are disabled
		//If sections are enabled this is a section with no properties
	},
	h: {
		$comment: "h section",
		$value: {
			a: "a value",
			b: {
				$comment: "b comment",
				$value: "b value"
			}
		}
	}
};
```

The possible settings are:
- encoding. _String_. `ascii` or `utf8`. If `ascii` is used, all the characters with code greater than 127 are converted to its unicode string representation. Default is `utf8`.
- bufferSize. _Number_. The buffer size used while writing the file. Default is 16KB.
- comment. _String_. The characters used to write comments. Default is `#`.
- separator. _String_. The characters used to separate keys from values. Default is `=`.
- sections. _Boolean_. Enables the sections. Default is false.
- header. _String_. A comment that is written at the beginning of the file.
- pretty. _Boolean_. If true, the stringified properties are pretty printed: tabbed and word wrapped at 80 columns.
- replacer. _Function_. The same as the reviver function but if the returned value is undefined the property or section is not stringified. Receives two parameters and optionally three if sections are enabled.

The comments (from properties and header) can be written as a multi-line comments, for example, if you write a property:

```javascript
a: {
	$comment: "line 1\nline2"
	$value: "b"
}
```

Then this will be written:

```text
#line 1
#line 2
a=b
```

The line separator could also be `\r\n`. Line separators are only used to split the comment, that is, if you're on Linux and write a comment `line1\r\nline2`, a `\n` will be used to write these lines.

Please, note that the ECMAScript specification does not guarantee the order of the object properties, so this module cannot guarantee that the properties will be stored with the same order. This module guarantees that if sections are enabled, the global properties (properties that doesn't belong to any section) will be written before the sections to avoid possible errors.

> ECMA-262 does not specify enumeration order. The de facto standard is to match insertion order, which V8 also does, but with one exception:
> V8 gives no guarantees on the enumeration order for array indices (i.e., a property name that can be parsed as a 32-bit unsigned integer).

<a name="stringify"></a>
__properties.stringify(obj[, settings])__  
Does the same as [store()](#store) but does not perform any I/O access, the output is a string.