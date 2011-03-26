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

process.chdir(__dirname);

var fs = require('fs');
var sys = require('sys');
var path = require('path');
var spawn = require('child_process').spawn;

var async = require('async');
var sprintf = require('sprintf').sprintf;
var longStackTraces = require('long-stack-traces/lib/long-stack-traces');

var constants = require('./constants');
var parser = require('./parser');
var common = require('./common');
var testUtil = require('./util');

var successes = 0;
var failures = 0;
var timeouts = 0;

var dateStart;

/**
 * Spawn a new child, run a test file and report results.
 *
 * @param {String} filePath Full Absolute path to the test file.
 * @param {Boolean} failfast True to exit after first failure.
 * @param {Number} verbosity Test runner verbosity (0 = quiet, 3 = very verbose).
 * @param {Function} callback Callback which is called on completion.
 */
var executeTest = function(filePath, failfast, verbosity, callback) {
  var fileName = path.basename(filePath);

  testUtil.printMsg(sprintf('Running test file: %s', fileName), verbosity, 3);

  var args = ['run_test_file.js', filePath];
  var child = spawn(process.execPath, args);
  var stderr = [];
  var stdout = [];
  var dead = false;
  var timedOut = false;
  var timeoutId;
  var succeededResult, failedResult;

  child.stderr.on('data', function(chunk) {
    stderr.push(chunk);
  });

  child.stdout.on('data', function(chunk) {
    stdout.push(chunk);
  });

  child.on('exit', function(code) {
    var stdoutJoined = stdout.join('');
    var stderrJoined = stderr.join('');

    if (!timedOut) {
      clearTimeout(timeoutId);

      result = common.parseResult(stderrJoined);
      succeededResult = result[0];
      failedResult = result[1];

      // Print test results
      sys.puts(fileName);
      common.reportSucceeded(succeededResult);
      common.reportFailed(failedResult);

      successes += Object.keys(succeededResult).length;
      failures += Object.keys(failedResult).length;

      if (failfast && failedResult) {
        common.printTestsSummary(dateStart, successes, failures, timeouts);
      }
    }
    else {
      timeouts++;
    }

    callback(null);
    return;
  });

  timeoutId = setTimeout(function() {
    timedOut = true;
    child.kill('SIGKILL');
  }, timeout);
};

var runTests = function(tests, failFast, verbosity) {
  dateStart = testUtil.getUnixTimestamp();
  async.forEachSeries(tests, function(test, callback) {
    executeTest(test, failFast, verbosity, callback);
  },

  function(err) {
    common.printTestsSummary(dateStart, successes, failures, timeouts);
  });
};

process.addListener('SIGINT', function() {
  common.printTestsSummary(dateStart, successes, failures, timeouts);
});

var failFast = false;
var verbosity = constants.DEFAULT_VERBOSITY;
var timeout = constants.DEFAULT_TEST_TIMEOUT;
var tests = [];

var run = function(argv) {
  var p = parser.getParser();
  p.banner = 'Usage: whiskey --tests "files" [options]';

  p.on('failfast', function(opt, value) {
    failFast = true;
  });

  p.on('verbosity', function(opt, value) {
    if (value) {
      verbosity = value;
    }
  });

  p.on('timeout', function(opt, value) {
    if (value) {
      timeout = value;
    }
  });

  p.on('tests', function(opt, value) {
    if (value) {
      tests = value.split(' ');
    }
    else {
      tests = [];
    }
  });

  p.parse(process.argv);

  if (tests.length > 0) {
    runTests(tests, failFast, verbosity);
  }
  else {
    sys.puts(p.banner);
  }
};

exports.run = run;
