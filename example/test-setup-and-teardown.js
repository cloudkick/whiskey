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
 */

var assert = require('assert');

var i = 0;
var called = false;
var n = 0;

exports['not_called'] = function() {
  assert.ok(false);
};

exports['setUp'] = function(callback) {
  i = 9;
  called = true;
  n++;
  callback();
};

exports['test_indexOf'] = function() {
  assert.ok(called);
  assert.equal('test'.indexOf('test'), 0);

  n++;
};

exports['test_throw'] = function() {
  assert.ok(called);

  try {
    throw new Error('test');
  }
  catch (err) {
    assert.ok(err);
  }

  n++;
};

exports['tearDown'] = function(callback) {
  assert.ok(called);
  assert.equal(n, 3);

  n++;
  callback();
};

process.on('exit', function() {
  assert.equal(n, 4);
  assert.ok(called);
});
