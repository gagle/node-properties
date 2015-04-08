'use strict';

var properties = require('../lib');
var eol = require('os').EOL;
var expect = require('code').expect;
var lab = module.exports.lab = require('lab').script();

var describe = lab.describe;
var it = lab.it;

var throws = function (obj, options) {
  return function () {
    properties.stringify(obj, options);
  };
};

describe('stringify', function () {
  it('should only accept single printable ASCII characters for the separator' +
      'token', function (done) {
    expect(throws({})).to.not.throw();

    expect(throws({}, { separator: 'a' })).to.throw();
    expect(throws({}, { separator: '=' })).to.not.throw();
    expect(throws({}, { separator: ':' })).to.not.throw();
    expect(throws({}, { separator: ' ' })).to.not.throw();

    done();
  });

  it('options are optional', function (done) {
    expect(throws({})).to.not.throw();

    expect(properties.stringify({})).to.equal('');

    done();
  });

  it('line', function (done) {
    expect(properties.stringify({ a: 1})).to.equal('a=1');

    done();
  });

  it('pretty separator', function (done) {
    expect(properties.stringify({ a: 1}, { pretty: true })).to.equal('a = 1');
    expect(properties.stringify({ a: 1}, {
      pretty: true,
      separator: ':'
    })).to.equal('a: 1');
    expect(properties.stringify({ a: 1}, {
      pretty: true,
      separator: ' '
    })).to.equal('a 1');
    expect(properties.stringify({ a: 1}, { pretty: true })).to.equal('a = 1');

    done();
  });

  it('keys with undefined or function values are not included',
      function (done) {
    expect(properties.stringify({ a: undefined })).to.equal('');
    expect(properties.stringify({ a: function () {} })).to.equal('');

    done();
  });

  it('keys with null values are included but without a value', function (done) {
    expect(properties.stringify({ a: null })).to.equal('a=');

    // typeof null === 'object' but it's not a child object
    expect(properties.stringify({ a: null }, {
      sections: true
    })).to.equal('a=');

    done();
  });

  it('eol is system-dependent', function (done) {
    expect(properties.stringify({ a: 1, b: 2 })).to.equal('a=1' + eol + 'b=2');

    done();
  });

  it('special characters in the key that are always escaped', function (done) {
    expect(properties.stringify({ '=': 1 })).to.equal('\\==1');
    expect(properties.stringify({ ':': 1 })).to.equal('\\:=1');
    expect(properties.stringify({ ' ': 1 })).to.equal('\\ =1');
    expect(properties.stringify({ '\\': 1 })).to.equal('\\\\=1');
    expect(properties.stringify({ '\t': 1 })).to.equal('\\t=1');
    expect(properties.stringify({ '\n': 1 })).to.equal('\\n=1');
    expect(properties.stringify({ '\f': 1 })).to.equal('\\f=1');
    expect(properties.stringify({ '\r': 1 })).to.equal('\\r=1');

    done();
  });

  it('special characters in the value that are always escaped',
      function (done) {
    expect(properties.stringify({ a: '\\' })).to.equal('a=\\\\');
    expect(properties.stringify({ a: '\t' })).to.equal('a=\\t');
    expect(properties.stringify({ a: '\n' })).to.equal('a=\\n');
    expect(properties.stringify({ a: '\f' })).to.equal('a=\\f');
    expect(properties.stringify({ a: '\r' })).to.equal('a=\\r');

    done();
  });

  it('first spaces before a printable character in the value are escaped',
      function (done) {
    expect(properties.stringify({ a: '  1 ' })).to.equal('a=\\ \\ 1 ');

    done();
  });

  it('control sets 0 and 1 are always encoded in unicode string literal',
      function (done) {
    expect(properties.stringify({ '\u0000': 1 })).to.equal('\\u0000=1');
    expect(properties.stringify({ '\u0080': 1 })).to.equal('\\u0080=1');
    expect(properties.stringify({ a: '\u0000' })).to.equal('a=\\u0000');
    expect(properties.stringify({ a: '\u0080' })).to.equal('a=\\u0080');

    done();
  });

  it('multibyte characters can be encoded in unicode string literal',
      function (done) {
    expect(properties.stringify({ '\u0100': 1 })).to.equal('\u0100=1');
    expect(properties.stringify({ '\u0100': 1 }, {
      unicode: true
    })).to.equal('\\u0100=1');
    expect(properties.stringify({ a: '\u0100' })).to.equal('a=\u0100');
    expect(properties.stringify({ a: '\u0100' }, {
      unicode: true
    })).to.equal('a=\\u0100');

    done();
  });

  it('latin1 characters (< 256) are not encoded in unicode string literal',
      function (done) {
    expect(properties.stringify({ '\u00F0': 1 })).to.equal('\u00F0=1');
    expect(properties.stringify({ '\u00F0': 1 }, {
      unicode: true
    })).to.equal('\u00F0=1');

    expect(properties.stringify({ a: '\u00F0' })).to.equal('a=\u00F0');
    expect(properties.stringify({ a: '\u00F0' }, {
      unicode: true
    })).to.equal('a=\u00F0');

    done();
  });

  it('objects without sections enabled are not deep-analyzed, just stringified',
      function (done) {
    expect(properties.stringify({ a: {} })).to.equal('a=' + {});

    done();
  });

  it('object with sections enabled', function (done) {
    var obj = {
      a: {
        b: 1
      },
      c: {
        d: {
          e: 1
        }
      },
      f: 1
    };

    expect(properties.stringify(obj, {
      sections: true
    })).to.equal(
      'f=1' + eol +
      '[a]' + eol +
      'b=1' + eol +
      '[c.d]' + eol +
      'e=1'
    );

    expect(properties.stringify(obj, {
      sections: true,
      pretty: true
    })).to.equal(
      'f = 1' + eol + eol +
      '[a]' + eol +
      'b = 1' + eol + eol +
      '[c.d]' + eol +
      'e = 1'
    );

    expect(properties.stringify({
      a: {
        b: 1
      }
    }, {
      sections: true,
      pretty: true
    })).to.equal(
      '[a]' + eol +
      'b = 1'
    );

    expect(properties.stringify({
      a: {
        b: {}
      }
    }, {
      sections: true
    })).to.equal('');

    done();
  });

  it('object with sections enabled', function (done) {
    var obj = {
      a: {
        b: 1
      },
      c: {
        d: {
          e: 1
        }
      },
      f: 1
    };

    expect(properties.stringify(obj, {
      sections: true
    })).to.equal(
      'f=1' + eol +
      '[a]' + eol +
      'b=1' + eol +
      '[c.d]' + eol +
      'e=1'
    );

    expect(properties.stringify(obj, {
      sections: true,
      pretty: true
    })).to.equal(
      'f = 1' + eol + eol +
      '[a]' + eol +
      'b = 1' + eol + eol +
      '[c.d]' + eol +
      'e = 1'
    );

    expect(properties.stringify({
      a: {
        b: 1
      }
    }, {
      sections: true,
      pretty: true
    })).to.equal(
      '[a]' + eol +
      'b = 1'
    );

    expect(properties.stringify({
      a: {
        b: {}
      }
    }, {
      sections: true
    })).to.equal('');

    done();
  });

  it('objects with circular references with sections enabled are not resolved',
      function (done) {
    expect(function () {
      var obj = {};
      obj.obj = obj;

      properties.stringify(obj, { sections: true });
    }).to.throw(RangeError);

    done();
  });

  it('the values can be replaced', function (done) {
    expect(properties.stringify({ a: 1 }, {
      replacer: function (key, value) {
        return value + 1;
      }
    })).to.equal('a=2');

    var obj = { a: 1 };
    var o;
    properties.stringify(obj, {
      replacer: function (key, value) {
        o = this;
        return value;
      }
    });
    expect(obj).to.equal(o);

    expect(properties.stringify({ a: 1 }, {
      replacer: function (key) {
        return key;
      }
    })).to.equal('a=a');

    expect(properties.stringify({ a: 1 }, {
      replacer: function () {}
    })).to.equal('');

    expect(properties.stringify({ a: 1 }, {
      replacer: function () {
        return null;
      }
    })).to.equal('a=');

    done();
  });

  it('values replaced by objects are deep-analyzed', function (done) {
    expect(properties.stringify({ a: 1 }, {
      replacer: function (key, value) {
        return key === 'a' ? { b: { c: 1 } } : value;
      },
      sections: true
    })).to.equal(
      '[a.b]' + eol +
      'c=1'
    );

    done();
  });

  it('arrays are not deep-analyzed, just stringified', function (done) {
    var arr = [1, 2];
    expect(properties.stringify({ a: arr })).to.equal('a=' + arr);

    done();
  });
});