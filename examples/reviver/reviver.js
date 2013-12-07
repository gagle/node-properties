"use strict";

var properties = require ("../../lib");

var options = {
  path: true,
  sections: true,
  reviver: function (key, value, section){
    //The global property "a" is removed
    if (this.isProperty && !section && key === "a") return;
    
    //Section "a" is removed
    if (this.isSection && section === "s1") return;
    
    //The value of the property "a" from the section "b" is modified
    if (this.isProperty && section === "s2" && key === "a") return value + 1;
    
    //Returns the rest of the lines
    return this.assert ();
  }
};

properties.parse ("reviver", options, function (error, p){
  if (error) return console.error (error);
  
  console.log (p);
  
  /*
  {
    s2: {
      a: 2
    },
    s3: {
      a: 1
    }
  }
  */
});