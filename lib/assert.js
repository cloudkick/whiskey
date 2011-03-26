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

var sys = require('sys');

var assert = require('assert');

var port = parseInt((Math.random() * (65500 - 2000) + 2000), 10);

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
    msg = msg || 'typeof ' + sys.inspect(obj) + ' is ' + real + ', expected ' + type;
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
    msg = msg || sys.inspect(str) + ' does not match ' + sys.inspect(regexp);
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
    msg = msg || sys.inspect(obj) + ' does not include ' + sys.inspect(val);
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
    msg = msg || sys.inspect(val) + ' has length of ' + val.length + ', expected ' + n;
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
                + '    Expected: ' + sys.inspect(res.body) + '\n'
                + '    Got: ' + sys.inspect(response.body)
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
