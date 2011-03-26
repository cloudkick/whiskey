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
var path = require('path');

var async = require('async');

var common = require('./common');
var constants = require('./constants');
var testUtil = require('./util');
var assert = require('./assert');

/**
 * Execute the test file after the event loop starts.
 *
 * @param {Function} initFunction Function which is called before each test file
 *                                is run.
 */
process.nextTick(function(initFunction) {
  if (!initFunction) {
    initFunction = function(callback) {
      callback(null);
    }
  }

  if (process.argv.length !== 3) {
    sys.puts('No test file specified');
    process.exit(1);
  }

  async.series([
    async.apply(initFunction)
  ],

  function(err) {
    if (err) {
      throw new Error('Error during test configuration');
    }

    var paths_to_require = [];
    var testPath = process.argv[2];
    var testModule = testPath.replace(/\.js$/, '');

    if (testPath.charAt(0) !== '/') {
      // Relative path add the cwd to the require.paths
      var cwd = process.cwd();
      util.addToRequirePaths(cwd);

    }
    else {
      var modulePath = path.dirname(testPath);
      testUtil.addToRequirePaths(modulePath);
    }

    var exportedFunctions = require(testModule);
    var exportedFunctionsNames = Object.keys(exportedFunctions);
    var functionsToRun;
    var setUpFunctionIndex, tearDownFunctionIndex;
    var testFunction, testFunctionName;

    var failed = {};
    var succeeded = {};

    functionsToRun = exportedFunctionsNames.filter(common.isValidTestFunctionName);
    functionsToRunLen = functionsToRun.length;
    setUpFunctionIndex = functionsToRun.indexOf(constants.SETUP_FUNCTION_NAME);
    tearDownFunctionIndex = functionsToRun.indexOf(constants.TEARDOWN_FUNCTION_NAME);

    // Call setUp function (if present)
    if (setUpFunctionIndex) {
      testFunction = exportedFunctions[constants.SETUP_FUNCTION_NAME];

      try {
        testFunction();
      }
      catch(err) {}
    }


    // Call tearDown function (if present)
    if (tearDownFunctionIndex) {
      testFunction = exportedFunctions[constants.TEARDOWN_FUNCTION_NAME];

      try {
        testFunction();
      }
      catch(err) {}
    }

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

    common.printChildResults(succeeded, failed);
  });
});
