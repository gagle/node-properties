var Properties = require ("../../build/properties");
var assert = require ("assert");

var o = {
    a1: { value: "b" },
    a2: { value: "::=b" },
    a3: { value: "b" },
    trunked1: { value: "foobar" },
    trunked2: { value: "foo" },
    "f#oo": { value: "#bar" },
    "foo bar": { value: "foo" },
    bar: { value: " bar" },
    "tab\tkey": { value: "bar" },
    "a-key": { value: "a \n value" },
    "": { value: "empty" },
    empty: { value: "" },
    empty2: { value: "" },
    "É": { value: "É" },
	"↑": { value: "↓" },
    E_unicode: { value: "É" },
    "←": { value: "→" },
    substitute: { value: "b", origValue: "${a1}" },
    "subst.a.value" : { value: "a_value" },
    "subst.b.value" : { value: "b_value" },
    recursive_substitute : { value: "b_value", origValue: "${subst.${substitute}.value}" },
    recursive_and_concated : { value: "b_value.a_value", origValue: "${subst.${substitute}.value}.${subst.a.value}" }
};

new Properties ().load ("test", function (error){
	assert.deepEqual (this._keys, o);
});
