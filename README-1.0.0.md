properties
==========

_Node.js project_

#### .properties parser/stringifier ####

Version: 1.0.0

[Specification](http://docs.oracle.com/javase/7/docs/api/java/util/Properties.html#load%28java.io.Reader%29)

This module implements the Java .properties specification and adds additional features like .ini sections, variables (key referencing) and the ability to add new tokens to parse comments and separators.

This is a .properties file parser/stringifier but it can also parse/stringify .ini files. Look at the [ini](https://github.com/gagle/node-properties/tree/master/examples/ini) examples for further details.

#### Installation ####

[![NPM](https://nodei.co/npm/properties.png?mini=true)](https://npmjs.org/package/properties)

#### Documentation ####

- [JSON](#json)
- [Sections](#sections)
- [Variables](#variables)
- [Namespaces](#namespaces)
- [INI](#ini)

#### Functions ####

- [_module_.stringifier([obj]) : Stringifier](#stringifier)
- [_module_.stringify(obj[, options][, callback]) : undefined | String](#stringify)
- [_module_.parse(data[, options][, callback]) : undefined | Object](#parse)

#### Objects ####

- [Stringifier](#Stringifier)

---

<a name="json"></a>
__JSON__

By default the value of a property is converted to a Number, Boolean or String. When the `json` option is enabled the value can be also parsed to Array or Object. The value must be a valid json data.

This is a very powerful feature because you can parse arrays. You can also parse objects but I recommend to use [namespaces](#namespaces) because with objects you have to surround with double quotes each key and if you want to write a multiline object you need to escape the line break.

```
a = ["string", 1, true]
```

if the namespaces are enabled the following two properties create the same object:

```
a = {\
	"b": 1\
}
a.b = 1
```

Creates:

```javascript
{
	a: {
		b: 1
	}	
}
```

Therefore, is much more easier and clear to write `a.b = 1` instead of `a = { "b": 1 }`.

You can also use [variables](#variables). Remember that the value must be a valid json data, the strings must be double quoted.

```
a = string
b = 1
c = ["${a}", ${b}]
```

---

<a name="sections"></a>
__Sections__

INI sections can be enabled with the `sections` option. With them you can better organize your configuration data.

```
app_name App

[web]
hostname 10.10.10.10
port 1234

[db]
hostname 10.10.10.20
port 4321
```

Creates:

```javascript
{
	app_name: "App",
	web: {
		hostname: "10.10.10.10",
		port: 1234
	},
	db: {
		hostname: "10.10.10.20",
		port: 4321
	}
}
```

---

<a name="variables"></a>
__Variables__

When the `variables` option is enabled you can get the value of another key. The value is read __before__ the type conversion. Imagine them like the C macros. They simply copy the characters, they don't care if the value is a number or a string.

```
a = 1
# b = 1
b = ${a}
```

If you need to get the value of a key that belongs to a section prefix the key with the section followed by `|`.

```
a = 1
[section]
a = 2
# b = 2
b = ${section|a}
```

You can use the variables anywhere including the variable itself. Look at the [variables](https://github.com/gagle/node-properties/blob/master/examples/variables/variables.js) example for further details.

```
a = 1
# s1
[s${a}]
a = b
b = c
# d = c
d = ${s${a}|${s${a}|a}}
```

You can also pass external variables with the `vars` option and use their value while the file is being parsed. This is an extremly useful feature because you don't need to change anything from your configuration files if you want to dynamically assign the value of the properties. It could be used to load different configurations depending on the environment. Look at the [vars](https://github.com/gagle/node-properties/blob/master/examples/variables/vars.js) and [environment-vars](https://github.com/gagle/node-properties/blob/master/examples/variables/environment-vars.js) examples for further details.

---

<a name="namespaces"></a>
__Namespaces__

When the `namespaces` option is enabled dot separated keys are parsed as namespaces, that is, they are interpreted as javascript objects.

```
a.b = 1
a.c.d = 2

```

These properties creates the following object:

```javascript
{
	a: {
		b: 1,
		c: {
			d: 2
		}
	}
}
```

You can also use sections and variables:

```
[s1]
a.b = 1
# a.c.d = 1
a.c.d = ${s1|a.b}

```

```javascript
{
	s1: {
		a: {
			b: 1,
			c: {
				d: 1
			}
		}
	}
}
```

The external variables can also be read using namespaces:

```javascript
var options = {
	vars: {
		a: {
			b: 1
		}
	}
};
```

```
# a = 1
a = ${a.b}
```

Look at the [namespaces](https://github.com/gagle/node-properties/blob/master/examples/namespaces/namespaces.js) example for further details.

---

<a name="ini"></a>
__INI__

This module implements the .properties specification but there are some options that can be enabled, some of them are the `sections`, `comments`, `separators` and `strict`. With these four options this module can parse INI files. There isn't an official INI specification, each program implements its own features, but there is a de facto standard that says that INI files are just .properties files with sections and the `=` token as a separator.

If you want to parse INI files hen enable these options:

```javascript
var options = {
	sections: true,
	comments: ";", //Some INI files also consider # as a comment, if so, add it, comments: [";", "#"]
	separators: "=",
	strict: true
};
```

The `strict` option says that __only__ the tokens that are specified in the `comments` and `separators` options are used to parse the file. If `strict` is not enabled, the default .properties comment (`#`, `!`) and separator (`=`, `:`) tokens are also used to parse comments and separators.

Note: The whitespace (` `, `\t`, `\f`) is still considered a separator even if `strict` is true.

---

<a name="stringifier"></a>
___module_.stringifier([obj]) : Stringifier__  
Creates a new `Stringifier`. This class helps to stringify data when you want to add sections to the final string.

This is needed because ECMA-262 does not specify an enumeration order when objects are iterated with a for-in loop. The de facto standard is to match insertion order, which V8 also does, but with one exception, numeric property names (those that can be parsed as a Number) are executed before any other key.

```javascript
var o = {
	a: null,
	b: null,
	"0": null,
	"1": null
};

for (var p in o) console.log (p);

/*
0
1
a
b
*/
```

Stringified json objects don't care about the order because each object is a namespace. Pure .properties files also don't care because all the file is a unique namespace, but .ini files have a problem because there could be global properties that don't belong to any section, to any namespace. If a numeric key is under a section, when it is stringified this key is added above of the all the data, so it is stringified as a global property when in fact it belongs to a section.

The `Stringifier` solves this issue and also allows you to write comments. The function accepts a parameter. If you pass an object it will be converted to a stringifier. It is not very useful because [stringify](#stringify) already converts automatically the object to a stringifier.

```javascript
var obj = { ... };
var stringifier ) properties.stringifier (obj);
properties.stringify (stringifier);

//The same as:
properties.stringify ({ ... });
```
---

<a name="stringify"></a>
___module_.stringify(obj[, options][, callback]) : undefined | String__  
Stringifies an object or a [Stringifier](#Stringifier).

If you don't need to add sections nor comments simply pass an object, but if need them you must use a stringifier.

If a callback is given, the result will be returned as the second parameter, otherwise the function returns it.

```javascript
str = properties.stringify ({ ... });

properties.stringify ({ ... }, function (error, str){
	//The "error" can be ignored, it is always null if the "path" option is not used
});
```

Options:

- __comment__ - _String_  
	The token to use to write comments. It must be a single printable non-whitespace ascii character. Default is `#`.
- __separator__ - _String_  
	The token to use to separate keys from values. It must be a single printable non-whitespace ascii character. Default is `=`.
- __unicode__ - _Boolean_  
	The .properties specification uses ISO 8859-1 (Latin-1) as a default encoding. In the other hand, Node.js has a utf8 default encoding. This means that if you want a full compatibility with Java, that is, you are generating a .properties file that is going to be read by a Java program, then set this option to true. This will encode all ascii extended and multibyte characters to their unicode string representation (`\uXXXX`).

	Non-printable control codes (control set 0 and 1) are always encoded as a unicode string except `\t`, `\n`, `\f` and `\r`. These characters will be simply escaped prepending a backslash.
	
	If you are in a system that can handle utf8 strings, e.g. Node.js, you don't need to use this option.
- __path__ - _String_ 
	By default `stringify()` returns a String and you decide what to do with it. If you want to write the final string to a file, give the path to a file. If this option is used the callback is mandatory. It takes 2 parameters, a possible error and the final string.
- __replacer__ - _Function_
	Each property or section can be removed or modified from the final string. It's the same than the replacer of the JSON.stringify function.

	The callback takes 3 parameters: key, value and section.  
	A property has a key and a value and can belong to a section. If it's a global property the section is set to null. If __undefined__ is returned the property won't be stringified, otherwise the returned value will be used as the property value.  
	If the key and the value are set to null then it's a section line. If true is returned it will be added with all its properties to the final string. If it returns a falsy value it won't be added.
	
	For your convenience, to know if the line is a property or is a section, you can access to `this.isProperty` and `this.isSection` from inside the replacer function. Also, `this.assert()` can be used to return the _default_ value, the unmodified value that will be used to stringify the line.
	
	`this.assert()` it's the same as:
	
	```javascript
	if (this.isProperty){
		return value;
	}else{
		//isSection
		return true;
	}
	```
	
	For example, a replacer that does nothing and a replacer that removes all the lines:
	
	```javascript
	function (key, value, section){
		//Returns all the lines
		return this.assert ();
	}
	```
	
	```javascript
	function (key, value, section){
		//Removes all the lines
	}
	```
	
	Look at the [replacer](https://github.com/gagle/node-properties/blob/master/examples/replacer.js) example for further details.

---

<a name="parse"></a>
___module_.parse(data[, options][, callback]) : undefined | Object__  


---

<a name="Stringifier"></a>
__Stringifier__  
As it is explained above, this class is used when you want to add sections or comments to the final string.

To create a stringifier use the [stringifier()](#stringifier) function.

__Methods__

- [Stringifier#header(comment) : Stringifier](#Stringifier_header)
- [Stringifier#property(obj) : Stringifier](#Stringifier_property)
- [Stringifier#section(obj) : Stringifier](#Stringifier_section)

<a name="Stringifier_header"></a>
__Stringifier#header(comment) : Stringifier__  
Writes a header comment. It will be written to the top of the final string. Returns the stringifier being used.

<a name="Stringifier_property"></a>
__Stringifier#property(obj) : Stringifier__  
Writes a property line. It takes an object that can contain 3 options: `key`, `value` and `comment`. Both the key and the value are converted to a string so they can be of any type. Returns the stringifier being used.

```javascript
stringifier
	//No value
	.property ({ key: "a" })
	.property ({ key: "b", value: [1, 2, 3] })
	//No key and no value
	.property ({ comment: "empty" })

/*
a = 
b = [1,2,3]
# empty
 = 
*/
```

<a name="Stringifier_section"></a>
__Stringifier#section(obj) : Stringifier__  
Writes a section line. It takes an object that can contain 2 options: `name` and `comment`. The name is converted to a string so it can be of any type. If you don't need to write a comment you can also pass the name instead of an object. Returns the stringifier being used.

```javascript
stringifier.section ("my section");

/*
[my section]
*/

stringifier.section ({ name: "my section", comment: "My Section" });

/*
# My Section
[my section]
*/
```

Look at the [stringify-ini](https://github.com/gagle/node-properties/blob/master/examples/ini/stringify-ini.js) example for further details.