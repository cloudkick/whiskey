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

var sprintf = require('sprintf').sprintf;

var constants = require('./constants');
var errors = require('./errors');

var printMsg = function(msg, verbosity, minVerbosity) {
  if (verbosity >= minVerbosity) {
    sys.puts(msg);
  }
};

var isNull = function(value) {
  if (value === null || (typeof value === 'string') && value === 'null') {
    return true;
  }

  return false;
};

/**
 * Call a function and ignore any error thrown.
 *
 * @param {Function} func Function to call.
 * @param {Object} context Context in which the function is called.
 * @param {Array} Function argument
 * @param {Function} callback Optional callback which is called at the end.
 */
var callIgnoringError = function(func, context, args, callback) {
  try {
    func.apply(context, args);
  }
  catch (err) {}

  if (callback) {
    callback();
  }
};

/**
 * Call the provided function, capture any thrown error and pass it to the
 * callback.
 *
 * @param {Function} func Function to call.
 * @param {Function} funcName Name of the passed function.
 * @param {Function} callback A callback which is called with an error as the
 *                            first argument if the provided function throws an
 *                            exception.
 */
var callAndCaptureError = function(func, funcName, callback) {
  var newErr;

  try {
    func(callback);
  }
  catch (err) {
    newErr = new errors.TestError(sprintf('%s_function_raised_an_exception', funcName), err);
    callback(newErr);
  }
};

/**
 * Call a provided function and if it doesn't complete in timeout number of
 * milliseconds, call a provided callback with an error.
 *
 * @param {Function} func Function to call.
 * @param {Function} funcName Name of the passed function.
 * @param {Boolean} throwError If false, an exception won't be passed to the
 *                             callback on timeout.
 * @param {Number} timeout Timeout in milliseconds.
 * @param {Function} callback A callback which is passed to the original
 *                           function or on timeout.
 */
var callWithTimeout = function(func, funcName, throwError, timeout, callback) {
  var called = false;

  var timeoutId = setTimeout(function() {
    var err;

    if (!called) {
      called = true;

      if (throwError) {
        err = new errors.TestError(sprintf('%s_function_timed_out', funcName));
        err.message = sprintf('Function did not complete in %s milliseconds.', timeout);
      }
      callback(err);
    }
  }, timeout);

  var wrappedCallback = function(err) {
    if (!called) {
      called = true;
      clearTimeout(timeoutId);

      err = (throwError === true) ? err : null;
      callback(err);
    }
  };

  callAndCaptureError(func, funcName, wrappedCallback);
};

/**
 * Add a path to the require.paths (if not already there)
 *
 * @param {String} moduleFilePath Path to the module file.
 * @param {String} cwd Current working directory (this variable is only used if a
 *                     relative path is passed in).
 */
var addToRequirePaths = function(moduleFilePath, cwd) {
  var modulePath;
  var pathToAdd;

  if (moduleFilePath.charAt(0) !== '/' && cwd) {
    // Relative path add the cwd to the require.paths
    pathToAdd = cwd;
  }
  else {
    modulePath = path.dirname(moduleFilePath);
    pathToAdd = modulePath;
  }

  if (require.paths.indexOf(pathToAdd) === -1) {
    require.paths.unshift(pathToAdd);
  }
};

/**
 * Return Unix timestamp.
 *
 * @return {Number} Unix timestamp.
 */
var getUnixTimestamp = function() {
  return (new Date().getTime() / 1000);
};

var addCharacters = function(string, width, character) {
  var width_ = width || 80;
  var character_ = character || ' ';
  var stringLen = string.length;
  var left = (width_ - stringLen);

  while (left--) {
    string += character_;
  }

  return string;
};

exports.printMsg = printMsg;
exports.isNull = isNull;

exports.callIgnoringError = callIgnoringError;
exports.callWithTimeout = callWithTimeout;

exports.addToRequirePaths = addToRequirePaths;
exports.getUnixTimestamp = getUnixTimestamp;
exports.addCharacters = addCharacters;
