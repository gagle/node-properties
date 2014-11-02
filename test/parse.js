"use strict";

var assert = require ("assert");
var properties = require ("../lib");
var path = require ("path");

//Avoid using __dirname all the time and to allow includes from a string
process.chdir (path.dirname (process.mainModule.filename));

var tests = {
  "parse": function (done){
    var options = { path: true };
    
    properties.parse ("properties", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a1: "b",
        a2: "b",
        a3: "b",
        a4: "b",
        a5: "b",
        "": "b",
        a6: null,
        a7: null,
        a8: null,
        a9: "b",
        a10: "b",
        a11: "b",
        a12: "b",
        "a121   ": "b",
        a13: null,
        a14: "b",
        a15: "b",
        "a16=": "=b",
        "\\": "\\\\  ",
        "a\\n\\\\17": "\\n\\\\b",
        a18: "b\n\t",
        " ": " ",
        "\n": "\n",
        "聵": "聵",
        "↑": "↓",
        a19: "É",
        "←": "→",
        "→": "→",
        "[a]": null
      });
      
      done ();
    });
  },
  "parse (no key, no value)": function (done){
    properties.parse (":", function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        "": null
      });
      
      done ();
    });
  },
  "parse (no json)": function (done){
    properties.parse ("a1 true\na2 false\na3 123\na4 [1, 2, \\\n		" +
        "3]\na5 : { \"1\"\\\n		: { \"2\": 3 }}", function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a1: true,
        a2: false,
        a3: 123,
        a4: "[1, 2, 3]",
        a5: "{ \"1\": { \"2\": 3 }}",
      });
      
      done ();
    });
  },
  "reviver": function (done){
    var options = {
      reviver: function (key, value){
        if (key === "a") return "b";
        if (key === "b") return;
        return this.assert ();
      }
    };
    
    properties.parse ("a 1\nb 1\nc 1", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: "b",
        c: 1
      });
      
      done ();
    });
  },
  "empty data": function (done){
    properties.parse ("", function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {});
      
      done ();
    });
  },
  "custom separator and comment tokens": function (done){
    var options = { comments: ";", separators: "-" };
    
    properties.parse (";a\n!a\na1:b\na2-b", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a1: "b",
        a2: "b"
      });
      
      done ();
    });
  },
  "custom separator and comment tokens, strict": function (done){
    var options = { comments: ";", separators: "-", strict: true };
    
    properties.parse (";a\n!a\na1:b\na2-b", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        "!a": null,
        "a1:b": null,
        a2: "b"
      });
      
      done ();
    });
  },
  "sections": function (done){
    var options = { sections: true, path: true };
    
    properties.parse ("sections", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: 1,
        s1: {
          a: 1
        },
        s2: {
          a: 1
        },
        s3: {},
        "a=1": {
          "b[": "a]c"
        },
        "": {
          a: 1
        },
        "a\\t\ta→聵": {
          a: 1
        }
      });
      
      done ();
    });
  },
  "sections, incomplete": function (done){
    var options = { sections: true, include: true };
    
    assert.throws (function (){
      properties.parse ("[a\n", options);
    });
    
    assert.throws (function (){
      properties.parse ("[a", options);
    });
    
    properties.parse ("include include-section-error-1", options,
        function (error, p){
      assert.ok (error);
      
      done ();
    });
  },
  "sections random": function (done){
    var data = "#a\n#b\n#\n\na=a value\nb=\n#c comment\nc=c value\n#d comment" +
        "\nd=\n[]\n#h section\n[h]\na=a value\n#b comment\nb=b value";
    var p = properties.parse (data, { sections: true });
    
    assert.deepEqual (p, {
      a: "a value",
      b: null,
      c: "c value",
      d: null,
      "": {},
      h: {
        a: "a value",
        b: "b value"
      }
    });
    
    done ();
  },
  "reviver with sections": function (done){
    var reviver = function (key, value, section){
      if (this.isSection) return section !== "a=1";
      return value;
    };
    var options = { sections: true, reviver: reviver, path: true };
    
    properties.parse ("sections", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: 1,
        s1: {
          a: 1
        },
        s2: {
          a: 1
        },
        s3: {},
        "": {
          a: 1
        },
        "a\\t\ta→聵": {
          a: 1
        }
      });
      
      done ();
    });
  },
  "variables": function (done){
    var options = { variables: true, path: true };
    
    properties.parse ("variables", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: null,
        "": "c",
        get: "s",
        "s1|temp": "d",
        b: "d",
        _c_d_: "e",
        r: "{{{|}}end$}}{{|"
      });
      
      done ();
    });
  },
  "variables, no recursion": function (done){
    var options = { variables: true };
    
    properties.parse ("a=${a}", options, function (error, p){
      assert.ok (error);
      
      done ();
    });
  },
  "variables with external vars": function (done){
    var options = { variables: true, vars: { "a.a": 2 } };
    
    properties.parse ("b=${a.a}", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        b: 2
      });
      
      done ();
    });
  },
  "variables with external vars and namespaces": function (done){
    var options = { variables: true, namespaces: true, vars: { a: { a: 2 } } };
    
    properties.parse ("b=${a.a}", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        b: 2
      });
      
      done ();
    });
  },
  "variables with sections": function (done){
    var options = { variables: true, sections: true, path: true };
    
    properties.parse ("variables-sections", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: 1,
        t: {
          get: "s"
        },
        s1: {
          e2: "ee",
          greet: "say hi",
          a: "am",
          b: "{say hi}, {name}!"
        },
        s2: {
          a: 12,
          "12": 34
        },
        "": {
          "1_a_12_34": "12 months",
          obvious: "1 year = 12 months",
          "123": 456,
          "456": 123
        }
      });
      
      done ();
    });
  },
  "variables with sections and namespaces": function (done){
    var options = {
      variables: true,
      sections: true,
      namespaces: true,
      path: true
    };
    
    properties.parse ("variables-sections-namespaces", options,
        function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: {
          b: "c"
        },
        c: {
          a: {
            b: {
              x: 1
            },
            e: 1
          }
        }
      });
      
      done ();
    });
  },
  "namespaces": function (done){
    var options = { path: true, variables: true, namespaces: true };
    
    properties.parse ("namespaces", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: {
          "": 1,
          b: 1,
          c: 11
        },
        b: {
          a: "a",
          b: "aa"
        },
        c: true
      });
      
      done ();
    });
  },
  "namespaces with sections": function (done){
    var options = {
      path: true, variables: true, namespaces: true, sections: true
    };
    
    properties.parse ("namespaces-sections", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: {
          a: 1,
          b: 1,
          c: 11
        },
        s1: {
          b: {
            a: "a",
            b: "aa"
          }
        },
        s2: {
          b: {
            c: {
              d: true
            }
          }
        }
      });
      
      done ();
    });
  },
  "namespaces with reviver": function (done){
    var options = {
      path: true,
      variables: true,
      namespaces: true,
      reviver: function (key, value){
        if (key[0] === "c") return;
        return this.assert ();
      }
    };
    
    properties.parse ("namespaces", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: {
          "": 1,
          b: 1,
          c: 11
        },
        b: {
          a: "a",
          b: "aa"
        }
      });
      
      done ();
    });
  },
  "namespaces with reviver and sections": function (done){
    var options = {
      path: true,
      variables: true,
      namespaces: true,
      sections: true,
      reviver: function (key, value, section){
        if (this.isSection && section === "s2.b.c") return;
        if (this.isProperty && key === "b.a") return "b";
        return this.assert ();
      }
    };
    
    properties.parse ("namespaces-sections", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: {
          a: 1,
          b: 1,
          c: 11
        },
        s1: {
          b: {
            a: "b",
            b: "ba"
          }
        }
      });
      
      done ();
    });
  },
  "namespaces (invalid)": function (done){
    var options = {
      namespaces: true
    };
    
    properties.parse ("a=1\na.b=2", options, function (error, p){
      assert.ok (error);
      
      done ();
    });
  },
  "include": function (done){
    var options = { path: true, include: true };
    
    properties.parse (".", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: 3,
        b: 2
      });
      
      done ();
    });
  },
  "include empty file": function (done){
    var options = { include: true };
    
    properties.parse ("include include-empty", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {});
      
      done ();
    });
  },
  "include with data": function (done){
    var options = { include: true };
    
    properties.parse ("include include-1", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: 2,
        b: 2
      });
      
      done ();
    });
  },
  "include with variables": function (done){
    var options = {
      path: true,
      include: true,
      variables: true,
      vars: {
        a: 2
      }
    };
    
    properties.parse ("../test/include-variables-1", options,
        function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: 1,
        b: 2
      });
      
      done ();
    });
  },
  "include with namespaces": function (done){
    var options = {
      path: true,
      include: true,
      namespaces: true,
      sections: true
    };
    
    properties.parse ("include-namespaces-1", options, function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: {
          b: {
            c: 2
          },
          c: {
            d: 1
          }
        }
      });
      
      done ();
    });
  },
  "include inside section": function (done){
    var options = {
      path: true,
      include: true,
      sections: true
    };
    
    properties.parse ("include-section-1", options, function (error, p){
      assert.ok (error);
      
      done ();
    });
  },
  "include relative from current file": function (done){
    var options = {
      include: true,
      sections: true
    };
    
    properties.parse ("include include-relative-1", options,
        function (error, p){
      assert.ifError (error);
      
      assert.deepEqual (p, {
        a: 2
      });
      
      done ();
    });
  },
  "cast values according to defaults": function(done) {
    var options = { path: true };

    properties.parse ("types", options,
      function (error, p){
        assert.ifError (error);

        assert.deepEqual (p, {
          a1: true,
          a2: false,
          a3: 123,
          a4: null,
          a5: undefined,
          a6: 123,
          a7: 291,
          a8: 1230
        });

        done ();
      }
    );
  },
  "cast values according to options": function(done) {
    var options = { path: true, casting: { nulls: false, undefineds: false, booleans: false, numbers: false } };

    properties.parse ("types", options,
      function (error, p){
        assert.ifError (error);

        assert.deepEqual (p, {
          a1: 'true',
          a2: 'false',
          a3: '123',
          a4: 'null',
          a5: 'undefined',
          a6: '0123',
          a7: '0x123',
          a8: '123e1'
        });

        done ();
      }
    );
  }
};

var keys = Object.keys (tests);
var keysLength = keys.length;

(function again (i){
  if (i<keysLength){
    var fn = tests[keys[i]];
    if (fn.length){
      fn (function (){
        again (i + 1);
      });
    }else{
      fn ();
      again (i + 1);
    }
  }
})(0);
