"use strict";

var PropertiesError = module.exports = function (msg){
	var error = Error.call (this, msg);
	Error.captureStackTrace (error, this.constructor);
	Object.defineProperty (error, "name", {
		enumerable: false,
		value: "PropertiesError"
	});
	return error;
}