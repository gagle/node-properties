var assert = require ("assert");
var Properties = require ("../build/properties").Properties;

var o = {
    a1: "b",
    a2: "::=b",
    a3: "b",
    trunked1: "foobar",
    trunked2: "foo",
    "f#oo": "#bar",
    "foo bar": "foo",
    bar: " bar",
    "tab\tkey": "bar",
    "a-key": "a \n value",
    "": "empty",
    empty: "",
    empty2: "",
    "É": "É",
    E_unicode: "É"
};

var properties = new Properties ();
properties.load ("test", function (error, loaded){
	assert.deepEqual (properties._keys, o);
});