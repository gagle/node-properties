"use strict";

var modifiers = {
  MOD_STABLE_NUMBER_COERCION: false
};

// @Chainable
module.exports = function (/** modifiers... */){
  [].forEach.call (arguments, function (modifier){
    if(modifier in modifiers)
      modifiers[modifier] = true;
    else
      throw new Error ("Invalid modifier name");
  });
  return this;
};

module.exports.modifiers = modifiers;
