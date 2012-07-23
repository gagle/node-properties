var Properties = require ("../../build/properties");
var assert = require ("assert");

var o = {
	a1: { value: "b", comment: null },
    a2: { value: "::=b", comment: null },
    a3: { value: "b", comment: null },
    trunked1: { value: "foobar", comment: null },
    trunked2: { value: "foo", comment: null },
    "f#oo": { value: "#bar", comment: null },
    "foo bar": { value: "foo", comment: null },
    bar: { value: " bar", comment: null },
    "tab\tkey": { value: "bar", comment: null },
    "a-key": { value: "a \n value", comment: null },
    "": { value: "empty", comment: null },
    empty: { value: null, comment: null },
    empty2: { value: null, comment: null },
    "É": { value: "É", comment: null },
	"↑": { value: "↓", comment: null },
    E_unicode: { value: "É", comment: null },
	"←": { value: "→", comment: null }
};

new Properties ().load ("test", function (error){
	assert.deepEqual (this._keys, o);
});