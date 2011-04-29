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

var path = require('path');

var sprintf = require('sprintf').sprintf;

var Reporter = require('./base').Reporter;
var testUtil = require('./../../util');

function CliReporter(tests, options) {
  Reporter.call(this, tests, options);

  this._dateStart = null;
  this._dateEnd = null;
  this._successes = 0;
  this._failures = 0;
  this._timeouts = 0;
}

CliReporter.prototype.handleTestsStart = function() {
  this._dateStart = testUtil.getUnixTimestamp();
};

CliReporter.prototype.handleTestFileStart = function(filePath) {
  var fileName = path.basename(filePath);
  console.log(fileName);
};

CliReporter.prototype.handleTestFileComplete = function(filePath,
                                                        resultObj) {
  var errMsg, tests, test, key;
  var fileName = path.basename(filePath);
  var error = resultObj.error;
  var testLen = resultObj.tests.length;

  var stdout = '';
  var stderr = '';

  if (error) {
    // Test file does not exist or an exception was thrown before the tests were
    // even run
    this._failures++;
    this._reportFailure(error.name, error.error);
    return;
  }

  tests = resultObj.tests;
  for (key in tests) {
    if (tests.hasOwnProperty(key)) {
      test = tests[key];

      if (test.error) {
        this._failures++;
        this._reportFailure(test.name, test.error);
      }
      else {
        this._successes++;
        this._reportSuccess(test.name);
      }
    }
  }

  if (resultObj.timeout) {
    this._timeouts++;
    this._reportTimeout();
  }

  if (this._failures > 0) {
    this._printStderr(resultObj.stderr);
    this._printStdout(resultObj.stdout);
  }
  else {
    if (this._options['print_stderr']) {
      this._printStderr(resultObj.stderr);
    }

    if (this._options['print_stdout']) {
      this._printStdout(resultObj.stdout);
    }
  }
};

CliReporter.prototype.handleTestsComplete = function() {
  this._dateEnd = testUtil.getUnixTimestamp();
  this._reportStatistics();

  return this._failures + this._timeouts;
};

CliReporter.prototype._printStdout = function(stdout) {
  if (stdout.length > 0) {
    console.log('');
    console.log('\033[1mStdout\033[22m:');
    console.log(stdout);
  }
};

CliReporter.prototype._printStderr = function(stdout) {
  if (stdout.length > 0) {
    console.log('');
    console.log('\033[1mStderr\033[22m:');
    console.log(stdout);
  }
};

CliReporter.prototype._reportSuccess = function(testName) {
  console.log(sprintf('  %s \033[1;32m[OK]\033[0m',
                      testUtil.addCharacters(testName, 74, ' ')));
};

CliReporter.prototype._reportFailure = function(testName, error) {
  var errMsg = (error.stack) ? error.stack : error.message;
  console.log(sprintf('  %s \033[1;31m[FAIL]\033[0m',
                      testUtil.addCharacters(testName, 72, ' ')));
  console.log('');
  console.log('\033[1mException\033[22m:');
  console.log(errMsg);
  console.log('');
};

CliReporter.prototype._reportTimeout = function() {
  console.log(sprintf('  %s \033[1;36m[TIMEOUT]\033[0m',
                      testUtil.addCharacters('timeout', 69, ' ')));
};

CliReporter.prototype._reportStatistics = function() {
  var runTime = (this._dateEnd - this._dateStart);
  var successes = this._successes;
  var failures = this._failures;
  var timeouts = this._timeouts;

  console.log(testUtil.addCharacters('', 81, '-'));
  console.log(sprintf('Ran %d tests in %0.3fs', (successes + failures), runTime));
  console.log('');
  console.log(sprintf('Successes: %s', successes));
  console.log(sprintf('Failures: %s', failures));
  console.log(sprintf('Timeouts: %s', timeouts));
  console.log('');

  if (failures === 0 && timeouts === 0) {
    console.log('\033[1;32mPASSED\033[0m');
  }
  else {
    console.log('\033[1;31mFAILED\033[0m');
  }
};

exports.name = 'cli';
exports.klass = CliReporter;
