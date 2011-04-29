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
var testUtil = require('./../util');

function TapReporter(tests, options) {
  Reporter.call(this, tests, options);

  this._testResults = {};
  this._successes = 0;
  this._failures = 0;
  this._timeouts = 0;
}

TapReporter.prototype.handleTestsStart = function() {
};

TapReporter.prototype.handleTestFileStart = function(filePath) {
};

TapReporter.prototype.handleTestFileComplete = function(filePath,
                                                        resultObj) {
  var errMsg, tests, test, key;
  var fileName = path.basename(filePath);
  var error = resultObj.error;
  var testLen = resultObj.tests.length;

  if (error) {
    // Test file does not exist or an exception was thrown before the tests were
    // even run
    this._addFailure(fileName, error.name);
    return;
  }

  tests = resultObj.tests;
  for (key in tests) {
    if (tests.hasOwnProperty(key)) {
      test = tests[key];

      if (test.error) {
        this._addFailure(fileName, test.name);
      }
      else {
        this._addSuccess(fileName, test.name);
      }
    }
  }

  if (resultObj.timeout) {
    this._addTimeout(fileName, 'timeout');
  }
};

TapReporter.prototype.handleTestsComplete = function() {
  this._reportResults();

  return this._failures + this._timeouts;
};

TapReporter.prototype._addSuccess = function(testFile, testName) {
  this._successes++;
  this._addResult(testFile, testName, 'success');
};

TapReporter.prototype._addFailure = function(testFile, testName) {
  this._failures++;
  this._addResult(testFile, testName, 'failure');
};

TapReporter.prototype._addTimeout = function(testFile, testName) {
  this._timeouts++;
  this._addResult(testFile, testName, 'timeout');
};

TapReporter.prototype._addResult = function(testFile, testName, testStatus) {
  if (!this._testResults.hasOwnProperty(testFile)) {
    this._testResults[testFile] = {};
  }
  this._testResults[testFile][testName] = {
    'file': testFile,
    'name': testName,
    'status': testStatus
  };
};

TapReporter.prototype._reportResults = function() {
  var self = this;
  var startNum, i, files, file, filesLen, testsLen, tests, test, testResult, testNum;
  files = Object.keys(this._testResults);
  filesLen = files.length;

  function getFileTestLen(file) {
    return Object.keys(self._testResults[file]).length;
  }

  testsLen = files.map(getFileTestLen).reduce(function (a, b) { return a + b; });

  if (testsLen === 0) {
    startNum = 0;
  }
  else {
    startNum = 1;
  }

  console.log('  %d..%d', startNum, testsLen);

  testNum = 1;
  for (i = 0; i < filesLen; i++) {
    testNum = i + 1;
    file = files[i];
    tests = this._testResults[file];

    for (test in tests) {
      if (tests.hasOwnProperty(test)) {
        testNum++;
        testResult = tests[test];

        if (testResult.status === 'success') {
          console.log('  ok %d - %s: %s', testNum, testResult.file, testResult.name);
        }
        else if (testResult.status === 'failure') {
          console.log('  not ok %d - %s: %s', testNum, testResult.file, testResult.name);
        }
        else if (testResult.status === 'timeout') {
          console.log('  not ok %d - %s: %s (timeout)', testNum, testResult.file,
                       testResult.name);
        }
      }
    }
  }
};

exports.TapReporter = TapReporter;
