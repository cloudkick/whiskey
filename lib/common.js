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
 */

var sys = require('sys');

var sprintf = require('sprintf').sprintf;
var constants = require('./constants');
var testUtil = require('./util');

var isValidTestFunctionName = function(name) {
  if (name.indexOf('test') === 0) {
    return true;
  }

  return false;
};

var runInitFunction = function(filePath, callback) {
  var initModule = null;

  try {
    initModule = require(filePath);
  }
  catch (err) {
    // Invalid init file path provided
    callback();
    return;
  }

  if (initModule) {
    if (initModule.hasOwnProperty(constants.INIT_FUNCTION_NAME)) {
      try {
        initModule[constants.INIT_FUNCTION_NAME](callback);
        return;
      }
      catch (err2) {
        callback();
        return;
      }
    }
  }

  callback();
};

var printChildResults = function(succeeded, failed) {
  var failedCount = Object.keys(failed).length;
  var succeededNames = Object.keys(succeeded);
  var err, failedMessages = [];

  process.stderr.write(constants.OUTPUT_DELIMITER);

  process.stderr.write(constants.SUCCEEDED_STRING);
  process.stderr.write(succeededNames.join(constants.TEST_NAME_DELIMITER));
  process.stderr.write('\n');

  process.stderr.write(constants.FAILED_STRING);

  for (var key in failed) {
    if (failed.hasOwnProperty(key)) {
      err = (failed[key].stack) ? failed[key].stack : failed[key].message;
      failedMessages.push(sprintf('%s%s%s', key, constants.ERROR_MESSAGE_DELIMITER,
                                  err));
    }
  }

  process.stderr.write(failedMessages.join(constants.TEST_NAME_DELIMITER));

  process.stderr.write('\n');

  process.stderr.write(constants.OUTPUT_DELIMITER);
};

/**
 * Parse name and error of the fail tests and name of the succeeded tests from
 * child stdderr.
 *
 * @param {String} Child stderr output.
 *
 * @return {Array} First member is an object with succeeded tests results and
 *                 a second member is an object with failed tests results.
 */
var parseResult = function(stderr) {
  var succeeded = {};
  var failed = {};

  var i;
  var succeededString, failedString;
  var succeededNames, failedNames;
  var succeededLen, succeededName;
  var failedValues, failedValuesLen, failedValue, split;

  var testOutputStart = stderr.indexOf(constants.OUTPUT_DELIMITER);
  var testOutputEnd = stderr.lastIndexOf(constants.OUTPUT_DELIMITER);

  stderr = stderr.substring(testOutputStart + constants.OUTPUT_DELIMITER.length,
                            testOutputEnd).trim();

  var succeededStart = stderr.indexOf(constants.SUCCEEDED_STRING);
  var failedStart = stderr.indexOf(constants.FAILED_STRING);
  var stderrLen = stderr.length;

  if ((succeededStart + constants.SUCCEEDED_STRING.length + 1) !== failedStart) {
    succeededString = stderr.substring(succeededStart + constants.SUCCEEDED_STRING.length,
                                       failedStart).trim();
    succeededNames = succeededString.split(constants.TEST_NAME_DELIMITER);
    succeededLen = succeededNames.length;

    for (i = 0; i < succeededLen; i++) {
      succeededName = succeededNames[i];
      succeeded[succeededName] = true;
    }
  }

  if ((failedStart + constants.FAILED_STRING.length) !== stderrLen) {
    failedString = stderr.substring(failedStart + constants.FAILED_STRING.length,
                                    stderrLen).trim();
    failedValues = failedString.split(constants.TEST_NAME_DELIMITER);
    failedValuesLen = failedValues.length;

    for (i = 0; i < failedValuesLen; i++) {
      failedValue = failedValues[i];
      split = failedValue.split(constants.ERROR_MESSAGE_DELIMITER);
      failed[split[0]] = split[1];
    }
  }

  return [ succeeded, failed ];
};

var reportSucceeded = function(succeeded) {
  var succeededNames = Object.keys(succeeded);
  var succeededLen = succeededNames.length;
  var i, succeededName;

  for (i = 0; i < succeededLen; i++) {
    succeededName = succeededNames[i];
    sys.puts(sprintf('  %s \033[1;32m[OK]\033[0m',
                     testUtil.addCharacters(succeededName, 74, ' ')));
  }
};

var reportFailed = function(failed) {
  var failedErr;

  for (var failedName in failed) {
    if (failed.hasOwnProperty(failedName)) {
      failedErr = failed[failedName];

      sys.puts(sprintf('  %s \033[1;31m[FAIL]\033[0m',
                       testUtil.addCharacters(failedName, 72, ' ')));
       sys.puts('');
       sys.puts('\033[1mException\033[22m:');
       sys.puts(failedErr);
    }
  }
};

var printStdout = function(stdout) {
  if (stdout.length > 0) {
    sys.puts('');
    sys.puts('\033[1mStdout\033[22m:');
    sys.puts(stdout);
  }
};

var printStderr = function(stderr) {
  var errorMakerStart, errorMakerEnd, errorString;

  if (stderr.length > 0) {
    errorMakerStart = stderr.indexOf(constants.OUTPUT_DELIMITER);
    errorMakerEnd = stderr.lastIndexOf(constants.OUTPUT_DELIMITER);

    if (errorMakerStart !== -1 && errorMakerEnd !== -1) {
      errorString = stderr.substring(errorMakerStart,
                                     errorMakerEnd + constants.OUTPUT_DELIMITER.length);
      stderr = stderr.replace(errorString, '');

      if (stderr.length === 0) {
        return;
      }
    }

    sys.puts('');
    sys.puts('\033[1mStderr\033[22m:');
    sys.puts(stderr);
  }
};

var printTestsSummary = function(dateStart, successes, failures, timeouts) {
  var dateEnd = testUtil.getUnixTimestamp();
  var runTime = (dateEnd - dateStart);

  sys.puts(testUtil.addCharacters('', 80, '-'));
  sys.puts(sprintf('Ran %d tests in %0.3fs', (successes + failures), runTime));
  sys.puts('');
  sys.puts(sprintf('Successes: %s', successes));
  sys.puts(sprintf('Failures: %s', failures));
  sys.puts(sprintf('Timeouts: %s', timeouts));
  sys.puts('');

  if (failures === 0 && timeouts === 0) {
    sys.puts('\033[1;32mPASSED\033[0m');
  }
  else {
    sys.puts('\033[1;31mFAILED\033[0m');
  }

  process.exit(failures + timeouts);
};

exports.runInitFunction = runInitFunction;
exports.isValidTestFunctionName = isValidTestFunctionName;
exports.printChildResults = printChildResults;
exports.parseResult = parseResult;
exports.reportSucceeded = reportSucceeded;
exports.reportFailed = reportFailed;
exports.printStdout = printStdout;
exports.printStderr = printStderr;
exports.printTestsSummary = printTestsSummary;
