"use strict";

var properties = require ("../../lib");

/*
The external vars can be used to dynamically assign the value of a property
using environment vars.

The basic idea is to have one file where we define all the properties that need
our system to work. Then we need two more files, one for the development
environment an another for the production. These two files contain just the
minimum properties that differenciate the development from the production
environment.

NODE_ENV=development node environment-vars.js
NODE_ENV=production node environment-vars.js
*/

var file;

if (process.env.NODE_ENV === "production"){
  file = "environment-vars-production";
}else{
  file = "environment-vars-development";
}

//First load the specific environment data
properties.parse (file, { path: true, sections: true }, function (error, env){
  if (error) return console.error (error);
  
  //Load the main configuration using as external vars the specific environment
  //properties
  //Tip: If the namespaces option is enabled you can read a value like this:
  //${web.hostname}, so you can pass the env object as an external var and read
  //from it using the dot separated keys nomenclature
  var options = {
    path: true,
    variables: true,
    sections: true,
    namespaces: true,
    vars: env
  };
  
  properties.parse ("environment-vars", options, function (error, p){
    if (error) return console.error (error);
    
    console.log (p);
    
    /*
    NODE_ENV=development
    
    {
      app: {
        name: "App",
        version: "0.0.1"
      },
      web: {
        hostname: "localhost",
        port: 1337
      },
      db: {
        hostname: "10.10.10.10",
        port: 1234,
        pool: {
          min: 5,
          max: 10
        }
      }
    }
    
    NODE_ENV=production
    
    {
      app: {
        name: "App",
        version: "0.0.1"
      },
      web: {
        hostname: "0.0.0.0",
        port: 80
      },
      db: {
        hostname: "10.10.10.20",
        port: 1234,
        pool: {
          min: 5,
          max: 10
        }
      }
    }
    */
  });
});