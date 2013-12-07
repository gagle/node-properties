"use strict";

var properties = require ("../../lib");

var options = {
  path: true,
  reviver: function (key, value, section){
    if (this.isSection) return this.assert ();
    //If the key begins with _ the property is not added
    if (key[0] === "_") return;
    return this.assert ();
  }
};

properties.parse ("private-vars", options, function (error, p){
  if (error) return console.error (error);
  
  console.log (p);
  
  /*
  {
    c: 1,
    d: 1
  }
  */
});