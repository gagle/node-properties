"use strict";

var Stringifier = require ("./stringifier");

module.exports = {
  with: require ("./with"),
  parse: require ("./read"),
  stringify: require ("./write"),
  createStringifier: function (){
    return new Stringifier ();
  }
};
