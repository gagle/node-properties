'use strict';

var eol = require('os').EOL;

var separators = {
  '=': function () {
    return ' = ';
  },
  ':': function () {
    return ': ';
  },
  ' ': function () {
    return ' ';
  }
};

var Stringifier = module.exports = function (options) {
  options = options || {};

  this._separator = options.separator || '=';

  if (!separators[this._separator]) {
    throw new Error('Invalid separator token');
  }

  if (options.pretty) {
    this._separator = separators[this._separator]();
  }

  this._eolSection = options.pretty ? eol : '';
  this._replacer = options.replacer || function (key, value) {
    return value;
  };
  this._sections = options.sections;
  this._first = true;

  this._escapeKey = {
    key: true,
    whitespace: true,
    unicode: options.unicode
  };

  this._escapeValue = {
    whitespace: true,
    unicode: options.unicode
  };
};

var unicode = function (code) {
  var str = code.toString(16);
  while (str.length !== 4) {
    str = '0' + str;
  }
  return '\\u' + str;
};

Stringifier.prototype.stringify = function (obj) {
  var str = this._stringify(obj);
  return str.substr(0, str.length - eol.length);
};

Stringifier.prototype._stringify = function (obj, section) {
  var childs = [];
  var out = '';

  Object.keys(obj).forEach(function (key) {
    var value = obj[key];

    value = this._replacer.call(obj, key, value);

    if (value === undefined || typeof value === 'function') return;

    if (this._isChildObject(value)) {
      childs.push({
        key: key,
        value: value
      });
      return;
    }

    out += this._line(key, value) + eol;
  }, this);

  if (out) {
    if (section) {
      out = this._section(section) + eol + out;
    }
    this._first = false;
  }

  section = (section ? section + '.' : '');

  childs.forEach(function (child) {
    out += this._stringify(child.value, section + child.key);
  }, this);

  return out;
};

Stringifier.prototype._isChildObject = function (value) {
  return this._sections && value !== null && typeof value === 'object' &&
      !Array.isArray(value);
};

Stringifier.prototype._escape = function (c, code, options) {
  // Encode characters to their unicode representation to be compatible with
  // ISO 8859-1 (latin1), the encoding assumed by Java to load .properties files

  // Escape the separator in the key string
  // 61 '='
  // 58 ':'
  if (options.key && (code === 61 || code === 58)) return '\\' + c;

  // 32 ' ' (space)
  if (code === 32 && options.whitespace) return '\\ ';

  // 92 '\' (backslash)
  if (code === 92) return '\\\\';

  // ASCII printable characters
  if (code > 31 && code < 127) return c;

  // ASCII non-printable characters
  // Escaped
  if (code === 9) return '\\t';
  if (code === 10) return '\\n';
  if (code === 12) return '\\f';
  if (code === 13) return '\\r';

  // Control sets 0 and 1
  if (code < 160) return unicode(code);

  // Printable 8-bit character (latin1)
  if (code < 256) return c;

  // Multibyte character
  return options.unicode ? unicode(code) : c;
};

Stringifier.prototype._key = function (key) {
  var str = '';
  var c;
  var code;

  for (var i = 0, il = key.length; i < il; i++) {
    c = key[i];
    code = key.charCodeAt(i);
    str += this._escape(c, code, this._escapeKey);
  }

  return str;
};

Stringifier.prototype._value = function (value) {
  if (value === null) return '';

  value += '';

  var str = '';
  var c;
  var code;

  this._escapeValue.whitespace = true;

  for (var i = 0, il = value.length; i < il; i++) {
    c = value[i];
    code = value.charCodeAt(i);

    // Whitespace at the beggining of the value must be escaped
    // 32 ' ' (space)
    // 9 '\t'
    // 12 '\f'
    if (code !== 32 && code !== 9 && code !== 12) {
      this._escapeValue.whitespace = false;
    }

    str += this._escape(c, code, this._escapeValue);
  }

  return str;
};

Stringifier.prototype._section = function (section) {
  return (this._first ? '' : this._eolSection) + '[' + section + ']';
};

Stringifier.prototype._line = function (key, value) {
  return this._key(key) + this._separator + this._value(value);
};