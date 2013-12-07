"use strict";

var properties = require ("../../lib");

var stringifier = properties.stringifier ()
    .header ("Stringifier example")
    .property ({ comment: "Global property", key: "a", value: 1 })
    .section ("empty")
    .section ({ comment: "Section", name: "a" })
    .property ({ key: "a", value: 1 })
    .property ({ key: "b", value: 1 });

var options = { comment: ";" };

var data = properties.stringify (stringifier, options);

console.log (data);

/*
; Stringifier example

; Global property
a = 1

[empty]

; Section
[a]
a = 1
b = 1
*/