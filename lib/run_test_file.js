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

var sys = require('sys');

var async = require('async');

var longStackTraces = require('./extern/long-stack-traces');

var common = require('./common');
var errors = require('./errors');
var constants = require('./constants');
var testUtil = require('./util');
var assert = require('./assert');

var failed = {};
var succeeded = {};

/**
 * Execute the test file after the event loop starts.
 */
process.nextTick(function() {
  if (process.argv.length < 3) {
    sys.puts('No test file specified');
    process.exit(1);
  }

  var paths_to_require = [];
  var testPath = process.argv[2];
  var cwd = (process.argv.length >= 4) ? process.argv[3] : null;
  var chdir = (process.argv.length >= 5) ? process.argv[4] : null;
  var testInitFile = (process.argv.length >= 6) ? process.argv[5] : null;
  var timeout = (process.argv.length === 7) ? parseInt(process.argv[6], 10) : null;
  var testModule = testPath.replace(/\.js$/, '');

  testUtil.addToRequirePaths(testPath, cwd);

  var exportedFunctions;

  if (!testUtil.isNull(chdir)) {
    testUtil.callIgnoringError(process.chdir, null, [chdir]);
  }

  try {
    exportedFunctions = require(testModule);
  }
  catch (err) {
    failed.file_does_not_exist = err;
    return;
  }

  var exportedFunctionsNames = Object.keys(exportedFunctions);
  var testInitModule = null, testInitFunction = null, functionsToRun, functionsToRunLen;
  var setUpFunctionIndex, tearDownFunctionIndex;
  var setUpFunction, tearDownFunction, testFunction, testFunctionName;

  functionsToRun = exportedFunctionsNames.filter(common.isValidTestFunctionName);
  functionsToRunLen = functionsToRun.length;
  setUpFunctionIndex = exportedFunctionsNames.indexOf(constants.SETUP_FUNCTION_NAME);
  tearDownFunctionIndex = exportedFunctionsNames.indexOf(constants.TEARDOWN_FUNCTION_NAME);

  var wrappedCallback = function(errName, err, callback) {
    // Original callback is wrapped so we can set the actual error name.
    var testErr = null;

    if (err) {
      testErr = new errors.TestError(errName, err);
    }

    callback(testErr);
  };

  async.series([
    function(callback) {
      // Call test init function (if present)
      if (!testUtil.isNull(testInitFile)) {
        try {
          testInitModule = require(testInitFile);
        }
        catch (err) {
          wrappedCallback('init_file_does_not_exist', err, callback);
          return;
        }

        testInitFunction = testInitModule[constants.INIT_FUNCTION_NAME];
        if (testInitFunction) {
          testUtil.callWithTimeout(testInitFunction, constants.INIT_FUNCTION_NAME,
                                   true, timeout, callback);
          return;
        }
      }

      callback();
    },

    function(callback) {
      // Call setUp function (if present)
      if (setUpFunctionIndex !== -1) {
        setUpFunction = exportedFunctions[constants.SETUP_FUNCTION_NAME];

        testUtil.callWithTimeout(setUpFunction, constants.SETUP_FUNCTION_NAME,
                                 true, timeout, callback);
        return;
      }

      callback();
    },

    function(callback) {
      // Run the tests
      for (var i = 0; i < functionsToRunLen; i++) {
        testFunctionName = functionsToRun[i];
        testFunction = exportedFunctions[testFunctionName];

        try {
          testFunction();
        }
        catch (err) {
          failed[testFunctionName] = err;
          continue;
        }

        succeeded[testFunctionName] = true;
      }

      callback();
    },

    function(callback) {
      // Call tearDown function (if present)
      if (tearDownFunctionIndex !== -1) {
        tearDownFunction = exportedFunctions[constants.TEARDOWN_FUNCTION_NAME];

        testUtil.callWithTimeout(tearDownFunction, constants.TEARDOWN_FUNCTION_NAME,
                                 true, timeout, callback);
        return;
      }

      callback();
    }],

    function(err) {
      if (err) {
        failed[err.errName] = err;
      }
    });
});

process.on('uncaughtException', function(err) {
  failed.uncaught_exception = err;
});

process.on('exit', function() {
  common.printChildResults(succeeded, failed);
  process.reallyExit(failed.length);
});
