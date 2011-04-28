/*
 * Licensed to Cloudkick, Inc ('Cloudkick') under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * Cloudkick licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Many of the modifications to 'assert' that take place here are borrowed
 * from the 'Expresso' test framework:
 *  <http://visionmedia.github.com/expresso/>
 *
 * Expresso
 * Copyright(c) TJ Holowaychuk <tj@vision-media.ca>
 * (MIT Licensed)
 */

var util = require('util');

var port = parseInt((Math.random() * (65500 - 2000) + 2000), 10);

// Code bellow is taken from Node core
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// UTILITY
var util = require('util');
var pSlice = Array.prototype.slice;

function getAssertModule(test) {
  var assert = {};

  // 1. The assert module provides functions that throw
  // AssertionError's when particular conditions are not met. The
  // assert module must conform to the following interface.

  // 2. The AssertionError is defined in assert.
  // new assert.AssertionError({ message: message,
  //                             actual: actual,
  //                             expected: expected })

  assert.AssertionError = function AssertionError(options) {
    this.name = 'AssertionError';
    this.test = test;
    this.message = options.message;
    this.actual = options.actual;
    this.expected = options.expected;
    this.operator = options.operator;
    var stackStartFunction = options.stackStartFunction || fail;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, stackStartFunction);
    }
  };
  util.inherits(assert.AssertionError, Error);

  assert.AssertionError.prototype.toString = function() {
    if (this.message) {
      return [this.name + ':', this.message].join(' ');
    } else {
      return [this.name + ':',
              JSON.stringify(this.expected),
              this.operator,
              JSON.stringify(this.actual)].join(' ');
    }
  };

  // assert.AssertionError instanceof Error

  assert.AssertionError.__proto__ = Error.prototype;

  // At present only the three keys mentioned above are used and
  // understood by the spec. Implementations or sub modules can pass
  // other keys to the AssertionError's constructor - they will be
  // ignored.

  // 3. All of the following functions must throw an AssertionError
  // when a corresponding condition is not met, with a message that
  // may be undefined if not provided.  All assertion methods provide
  // both the actual and expected values to the assertion error for
  // display purposes.

  function fail(actual, expected, message, operator, stackStartFunction) {
    throw new assert.AssertionError({
      message: message,
      actual: actual,
      expected: expected,
      operator: operator,
      stackStartFunction: stackStartFunction
    });
  }

  // EXTENSION! allows for well behaved errors defined elsewhere.
  assert.fail = fail;

  // 4. Pure assertion tests whether a value is truthy, as determined
  // by !!guard.
  // assert.ok(guard, message_opt);
  // This statement is equivalent to assert.equal(true, guard,
  // message_opt);. To test strictly for the value true, use
  // assert.strictEqual(true, guard, message_opt);.

  assert.ok = function ok(value, message) {
    if (!!!value) fail(value, true, message, '==', assert.ok);
  };

  // 5. The equality assertion tests shallow, coercive equality with
  // ==.
  // assert.equal(actual, expected, message_opt);

  assert.equal = function equal(actual, expected, message) {
    if (actual != expected) fail(actual, expected, message, '==', assert.equal);
  };

  // 6. The non-equality assertion tests for whether two objects are not equal
  // with != assert.notEqual(actual, expected, message_opt);

  assert.notEqual = function notEqual(actual, expected, message) {
    if (actual == expected) {
      fail(actual, expected, message, '!=', assert.notEqual);
    }
  };

  // 7. The equivalence assertion tests a deep equality relation.
  // assert.deepEqual(actual, expected, message_opt);

  assert.deepEqual = function deepEqual(actual, expected, message) {
    if (!_deepEqual(actual, expected)) {
      fail(actual, expected, message, 'deepEqual', assert.deepEqual);
    }
  };

  function _deepEqual(actual, expected) {
    // 7.1. All identical values are equivalent, as determined by ===.
    if (actual === expected) {
      return true;

    } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
      if (actual.length != expected.length) return false;

      for (var i = 0; i < actual.length; i++) {
        if (actual[i] !== expected[i]) return false;
      }

      return true;

    // 7.2. If the expected value is a Date object, the actual value is
    // equivalent if it is also a Date object that refers to the same time.
    } else if (actual instanceof Date && expected instanceof Date) {
      return actual.getTime() === expected.getTime();

    // 7.3. Other pairs that do not both pass typeof value == 'object',
    // equivalence is determined by ==.
    } else if (typeof actual != 'object' && typeof expected != 'object') {
      return actual == expected;

    // 7.4. For all other Object pairs, including Array objects, equivalence is
    // determined by having the same number of owned properties (as verified
    // with Object.prototype.hasOwnProperty.call), the same set of keys
    // (although not necessarily the same order), equivalent values for every
    // corresponding key, and an identical 'prototype' property. Note: this
    // accounts for both named and indexed properties on Arrays.
    } else {
      return objEquiv(actual, expected);
    }
  }

  function isUndefinedOrNull(value) {
    return value === null || value === undefined;
  }

  function isArguments(object) {
    return Object.prototype.toString.call(object) == '[object Arguments]';
  }

  function objEquiv(a, b) {
    if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
      return false;
    // an identical 'prototype' property.
    if (a.prototype !== b.prototype) return false;
    //~~~I've managed to break Object.keys through screwy arguments passing.
    //   Converting to array solves the problem.
    if (isArguments(a)) {
      if (!isArguments(b)) {
        return false;
      }
      a = pSlice.call(a);
      b = pSlice.call(b);
      return _deepEqual(a, b);
    }
    try {
      var ka = Object.keys(a),
          kb = Object.keys(b),
          key, i;
    } catch (e) {//happens when one is a string literal and the other isn't
      return false;
    }
    // having the same number of owned properties (keys incorporates
    // hasOwnProperty)
    if (ka.length != kb.length)
      return false;
    //the same set of keys (although not necessarily the same order),
    ka.sort();
    kb.sort();
    //~~~cheap key test
    for (i = ka.length - 1; i >= 0; i--) {
      if (ka[i] != kb[i])
        return false;
    }
    //equivalent values for every corresponding key, and
    //~~~possibly expensive deep test
    for (i = ka.length - 1; i >= 0; i--) {
      key = ka[i];
      if (!_deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  // 8. The non-equivalence assertion tests for any deep inequality.
  // assert.notDeepEqual(actual, expected, message_opt);

  assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
    if (_deepEqual(actual, expected)) {
      fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
    }
  };

  // 9. The strict equality assertion tests strict equality, as determined by ===.
  // assert.strictEqual(actual, expected, message_opt);

  assert.strictEqual = function strictEqual(actual, expected, message) {
    if (actual !== expected) {
      fail(actual, expected, message, '===', assert.strictEqual);
    }
  };

  // 10. The strict non-equality assertion tests for strict inequality, as
  // determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

  assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
    if (actual === expected) {
      fail(actual, expected, message, '!==', assert.notStrictEqual);
    }
  };

  function expectedException(actual, expected) {
    if (!actual || !expected) {
      return false;
    }

    if (expected instanceof RegExp) {
      return expected.test(actual);
    } else if (actual instanceof expected) {
      return true;
    } else if (expected.call({}, actual) === true) {
      return true;
    }

    return false;
  }

  function _throws(shouldThrow, block, expected, message) {
    var actual;

    if (typeof expected === 'string') {
      message = expected;
      expected = null;
    }

    try {
      block();
    } catch (e) {
      actual = e;
    }

    message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
              (message ? ' ' + message : '.');

    if (shouldThrow && !actual) {
      fail('Missing expected exception' + message);
    }

    if (!shouldThrow && expectedException(actual, expected)) {
      fail('Got unwanted exception' + message);
    }

    if ((shouldThrow && actual && expected &&
        !expectedException(actual, expected)) || (!shouldThrow && actual)) {
      throw actual;
    }
  }

  // 11. Expected to throw an error:
  // assert.throws(block, Error_opt, message_opt);

  assert.throws = function(block, /*optional*/error, /*optional*/message) {
    _throws.apply(this, [true].concat(pSlice.call(arguments)));
  };

  // EXTENSION! This is annoying to write outside this module.
  assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
    _throws.apply(this, [false].concat(pSlice.call(arguments)));
  };

  assert.ifError = function(err) { if (err) {throw err;}};


  /*
   * Alias deepEqual as eql for complex equality
   */
  assert.eql = assert.deepEqual;

  /**
   * Assert that `val` is null.
   *
   * @param {Mixed} val
   * @param {String} msg
   */
  assert.isNull = function(val, msg) {
      assert.strictEqual(null, val, msg);
  };

  /**
   * Assert that `val` is not null.
   *
   * @param {Mixed} val
   * @param {String} msg
   */
  assert.isNotNull = function(val, msg) {
      assert.notStrictEqual(null, val, msg);
  };

  /**
   * Assert that `val` is undefined.
   *
   * @param {Mixed} val
   * @param {String} msg
   */
  assert.isUndefined = function(val, msg) {
      assert.strictEqual(undefined, val, msg);
  };

  /**
   * Assert that `val` is not undefined.
   *
   * @param {Mixed} val
   * @param {String} msg
   */
  assert.isDefined = function(val, msg) {
      assert.notStrictEqual(undefined, val, msg);
  };

  /**
   * Assert that `obj` is `type`.
   *
   * @param {Mixed} obj
   * @param {String} type
   * @api public
   */
  assert.type = function(obj, type, msg){
      var real = typeof obj;
      msg = msg || 'typeof ' + util.inspect(obj) + ' is ' + real + ', expected ' + type;
      assert.ok(type === real, msg);
  };

  /**
   * Assert that `str` matches `regexp`.
   *
   * @param {String} str
   * @param {RegExp} regexp
   * @param {String} msg
   */
  assert.match = function(str, regexp, msg) {
      msg = msg || util.inspect(str) + ' does not match ' + util.inspect(regexp);
      assert.ok(regexp.test(str), msg);
  };

  /**
   * Assert that `val` is within `obj`.
   *
   * Examples:
   *
   *    assert.includes('foobar', 'bar');
   *    assert.includes(['foo', 'bar'], 'foo');
   *
   * @param {String|Array} obj
   * @param {Mixed} val
   * @param {String} msg
   */
  assert.includes = function(obj, val, msg) {
      msg = msg || util.inspect(obj) + ' does not include ' + util.inspect(val);
      assert.ok(obj.indexOf(val) >= 0, msg);
  };

  /**
   * Assert length of `val` is `n`.
   *
   * @param {Mixed} val
   * @param {Number} n
   * @param {String} msg
   */
  assert.length = function(val, n, msg) {
      msg = msg || util.inspect(val) + ' has length of ' + val.length + ', expected ' + n;
      assert.equal(n, val.length, msg);
  };

  /**
   * Assert response from `server` with
   * the given `req` object and `res` assertions object.
   *
   * @param {Server} server
   * @param {Object} req
   * @param {Object|Function} res
   * @param {String} msg
   */
  assert.response = function(server, req, res, msg){
    // Callback as third or fourth arg
    var callback = typeof res === 'function'
        ? res
        : typeof msg === 'function'
            ? msg
            : function(){};

    // Default messate to test title
    if (typeof msg === 'function') msg = null;
    msg = msg || assert.testTitle;
    msg += '. ';

    // Pending responses
    server.__pending = server.__pending || 0;
    server.__pending++;

    server.listen(server.__port = port++, '127.0.0.1');

    process.nextTick(function() {
      // Issue request
      var timer;
      var trailer;
      var method = req.method || 'GET';
      var status = res.status || res.statusCode;
      var data = req.data || req.body;
      var streamer = req.streamer;
      var timeout = req.timeout || 0;
      var headers = req.headers || {};

      for (trailer in req.trailers) {
        if (req.trailers.hasOwnProperty(trailer)) {
          if (headers['Trailer']) {
            headers['Trailer'] += ', ' + trailer;
          }
          else {
            headers['Trailer'] = trailer;
          }
        }
      }

      var request = client.request(method, req.url, headers);
      if (req.trailers) {
        request.addTrailers(req.trailers);
      }

      // Timeout
      if (timeout) {
        timer = setTimeout(function(){
          --server.__pending || server.close();
          delete req.timeout;
          assert.fail(msg + 'Request timed out after ' + timeout + 'ms.');
        }, timeout);
      }

      if (data) request.write(data);

      request.addListener('response', function(response) {
        response.body = '';
        response.setEncoding('utf8');
        response.addListener('data', function(chunk){ response.body += chunk; });
        response.addListener('end', function(){
          --server.__pending || server.close();
          if (timer) clearTimeout(timer);

          // Assert response body
          if (res.body !== undefined) {
            assert.equal(
              response.body,
              res.body,
              msg + 'Invalid response body.\n'
                  + '    Expected: ' + util.inspect(res.body) + '\n'
                  + '    Got: ' + util.inspect(response.body)
            );
          }

          // Assert response status
          if (typeof status === 'number') {
            assert.equal(
              response.statusCode,
              status,
              msg + colorize('Invalid response status code.\n'
                  + '    Expected: [green]{' + status + '}\n'
                  + '    Got: [red]{' + response.statusCode + '}')
            );
          }

          // Assert response headers
          if (res.headers) {
            var keys = Object.keys(res.headers);
            for (var i = 0, len = keys.length; i < len; ++i) {
              var name = keys[i];
              var actual = response.headers[name.toLowerCase()];
              var expected = res.headers[name];
              assert.equal(
                actual,
                expected,
                msg + colorize('Invalid response header [bold]{' + name + '}.\n'
                    + '    Expected: [green]{' + expected + '}\n'
                    + '    Got: [red]{' + actual + '}')
              );
            }
          }
      });

      if (streamer) {
        streamer(request);
        return;
        }

        request.end();
      });
    });
  };

  return assert;
}

exports.getAssertModule = getAssertModule;
