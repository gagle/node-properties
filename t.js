'use strict';

var properties = require('./lib');

/*var stringifier = properties.createStringifier();

stringifier.comment('𐐀');

console.log(properties.stringify(stringifier));*/

var obj = {};
  /*http: {
    port: 8088,
    tlsPort: 4443,
    host: '0.0.0.0'
  },
  log: {
    level: 'info',
    colors: true,
    pretty: false,
    timestamp: false
  },
  dns: {
    port: 5333,
    host: '0.0.0.0',
    externalIP: '192.168.1.101',
    oldDNS: {
      address: '8.8.8.8',
      port: 57,
      type: 'udp'
    },
    oldDNSMethod: 0
  },*/

obj.o = obj;

var options = {
  sections: true,
  pretty: true,
  /*replacer: function (key, value) {
    if (key === 'a') return {b:{c:2}};
    return value;
  }*/
};

var str = properties.stringify(obj, options);

console.log(str);