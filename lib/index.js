'use strict';

var Stringifier = require('./stringifier');

exports.stringify = function (obj, options) {
  return new Stringifier(options).stringify(obj);
};