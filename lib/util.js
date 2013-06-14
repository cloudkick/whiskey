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

/*
 * lpad and rpad are taken from expresso
 *  <https://github.com/visionmedia/expresso> which is MIT licensed.
 *  Copyright(c) TJ Holowaychuk <tj@vision-media.ca>
 */

var util = require('util');
var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var sprintf = require('sprintf').sprintf;
var async = require('async');

var constants = require('./constants');
var errors = require('./errors');

var printMsg = function(msg, verbosity, minVerbosity) {
  if (verbosity >= minVerbosity) {
    util.puts(msg);
  }
};

var isNullOrUndefined = function(value) {
  if (value === null || ((typeof value === 'string') && value === 'null') ||
      value === undefined || ((typeof value === 'string') &&
      value === 'undefined')) {
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

  if (left <= 0) {
    return string;
  }

  while (left--) {
    string += character_;
  }

  return string;
};

/**
 * Pad the given string to the maximum width provided.
 *
 * @param  {String} str
 * @param  {Number} width
 * @return {String}
 */
function lpad(str, width) {
    str = String(str);
    var n = width - str.length;

    if (n < 1) {
      return str;
    }

    while (n--) {
      str = ' ' + str;
    }

    return str;
}

/**
 * Pad the given string to the maximum width provided.
 *
 * @param  {String} str
 * @param  {Number} width
 * @return {String}
 */
function rpad(str, width) {
  str = String(str);
  var n = width - str.length;

  if (n < 1) {
    return str;
  }

  while (n--) {
    str = str + ' ';
  }

  return str;
}

function LineProcessor(initialData) {
  this._buffer = initialData || '';
}

util.inherits(LineProcessor, EventEmitter);

LineProcessor.prototype.appendData = function(data) {
  this._buffer += data;
  this._processData();
};

LineProcessor.prototype._processData = function() {
  var newLineMarkerIndex, line;

  newLineMarkerIndex = this._buffer.indexOf('\n');
  while (newLineMarkerIndex !== -1) {
    line = this._buffer.substring(0, newLineMarkerIndex);
    this._buffer = this._buffer.substring(newLineMarkerIndex + 1);
    newLineMarkerIndex = this._buffer.indexOf('\n');

    this.emit('line', line);
  }
};

function EndMarker() {
  this.handleResult = function() {
    // does nothing; end of input has no results to handle.
  };

  this.throwPendingExceptions = function() {
    // does nothing; end of input has no exceptions to handle.
  };
};

function ExceptionMarker(err) {
  this._err = err;

  this.handleResult = function() {
    // does nothing; exceptions aren't tests.
  };

  this.throwPendingExceptions = function() {
    throw this._err;
  };
};

function CoverageMarker(testRunner, filePath, coverage) {
  this._runner = testRunner;
  this._filePath = filePath;
  this._coverage = coverage;

  this.handleResult = function() {
    this._runner._handleTestCoverageResult(this._filePath, this._coverage);
  };

  this.throwPendingExceptions = function() {
    // No exceptions exist for test results.
  };
};

function TestResultMarker(testRunner, filePath, resultObj) {
  this._runner = testRunner;
  this._filePath = filePath;
  this._results = resultObj;

  this.handleResult = function() {
    this._runner._handleTestResult(this._filePath, this._results);
  };

  this.throwPendingExceptions = function() {
    // No exceptions exist for test results.
  };
};

function parseResultLine(line, runner) {
  // Returns one of {TestResultMarker, CoverageMarker,
  // ExceptionMarker, or EndMarker} instances.  In each
  // case, the object methods handleResult() and
  // throwPendingExceptions() behave appropriately for the
  // specific case represented by the marker object.

  var startMarkerIndex, endMarkerIndex, testFileEndMarkerIndex, exceptionIndex;
  var coverageEndMarker, split, fileName, resultObj;
  var exceptionString, exceptionObj, exceptionJsons, msg;

  testFileEndMarkerIndex = line.indexOf(constants.TEST_FILE_END_MARKER);
  coverageEndMarker = line.indexOf(constants.COVERAGE_END_MARKER);
  startMarkerIndex = line.indexOf(constants.TEST_START_MARKER);
  endMarkerIndex = line.indexOf(constants.TEST_END_MARKER);
  exceptionIndex = line.indexOf(constants.EXCEPTION_END_MARKER);

  if (testFileEndMarkerIndex !== -1) {
    return new EndMarker();
  }
  else if (coverageEndMarker !== -1) {
    split = line.split(constants.DELIMITER);
    resultObj = split[1].replace(constants.COVERAGE_END_MARKER, '');
    return new CoverageMarker(runner, split[0], resultObj);
  }
  else if (exceptionIndex !== -1) {
    exceptionString = line.split(constants.DELIMITER);
    exceptionJsons = exceptionString[1].split(constants.EXCEPTION_END_MARKER);
    msg = sprintf("** EXCEPTION CAUGHT IN CHILD PROCESS **\n\n%s\n\n%s",
                  exceptionString || 'No exception message assign to this error.',
                  exceptionJsons[0]);
    exception = new Error(msg);
    return new ExceptionMarker(exception);
  }
  else {
    line = line.replace(constants.TEST_START_MARKER, '')
               .replace(constants.TEST_END_MARKER, '');
    split = line.split(constants.DELIMITER);
    resultObj = JSON.parse(split[1]);
    return new TestResultMarker(runner, split[0], resultObj);
  }
}

function isTestFile(filePath) {
  var exportedValues, key, value;

  try {
    exportedValues = require(filePath);
  }
  catch (err) {
    return false;
  }

  for (key in exportedValues) {
    if (exportedValues.hasOwnProperty(key)) {
      value = exportedValues[key];
      if (key.indexOf('test') === 0 && (typeof value === 'function')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get files in a directory which match the provided name pattern.
 * Note: This function recurses into sub-directories.
 *
 * @param {String} directory Directory to search.
 * @param {String} matchPattern File name match pattern.
 * @param {Object} options Optional options object.
 * @param {Function} callback Callback called with (err, matchingFilePaths).
 */
function getMatchingFiles(directory, matchPattern, options, callback) {
  options = options || {};
  var matchedFiles = [],
      recurse = options.recurse || false;

  fs.readdir(directory, function(err, files) {
    if (err) {
      callback(null, matchedFiles);
      return;
    }

    async.forEach(files, function(file, callback) {
      var filePath = path.join(directory, file);
      fs.stat(filePath, function(err, stats) {
        if (err) {
          callback();
        }
        else if (stats.isDirectory() && recurse) {
          getMatchingFiles(filePath, matchPattern, options, callback);
        }
        else if (matchPattern.test(file)) {
          matchedFiles.push(filePath);
          callback();
        }
        else {
          callback();
        }
      });
    },

    function(err) {
      callback(err, matchedFiles);
    });
  });
}

function findTestFiles(basePath, callback) {
  getMatchingFiles(basePath, /\.js/, {'recurse': true}, callback);
}

function parseArguments(rules, args) {
  var key, value, rule;
  var result = {};

  for (key in rules) {
    if (rules.hasOwnProperty(key)) {
      rule = rules[key];
      value = args[rule['pos']];

      if (isNullOrUndefined(value)) {
        value = null;
      }
      else if (rule['type'] === 'number') {
        value = parseInt(value, 10);
      }

      result[key] = value;
    }
  }

  return result;
}

/**
 * Wrap a function so that the original function will only be called once,
 * regardless of how  many times the wrapper is called.
 * @param {Function} fn The to wrap.
 * @return {Function} A function which will call fn the first time it is called.
 */
function fireOnce(fn) {
  var fired = false;
  return function wrapped() {
    if (!fired) {
      fired = true;
      fn.apply(null, arguments);
    }
  };
}

/**
 * Very simple object merging.
 * Merges two objects together, returning a new object containing a
 * superset of all attributes.  Attributes in b are prefered if both
 * objects have identical keys.
 *
 * @param {Object} a Object to merge.
 * @param {Object} b Object to merge, wins on conflict.
 * @return {Object} The merged object.
 */
function merge(a, b) {
  var c = {};
  var attrname;
  for (attrname in a) {
    if (a.hasOwnProperty(attrname)) {
      c[attrname] = a[attrname];
    }
  }
  for (attrname in b) {
    if (b.hasOwnProperty(attrname)) {
      c[attrname] = b[attrname];
    }
  }
  return c;
}

exports.printMsg = printMsg;
exports.isNullOrUndefined = isNullOrUndefined;

exports.getUnixTimestamp = getUnixTimestamp;
exports.addCharacters = addCharacters;

exports.rpad = rpad;
exports.lpad = lpad;

exports.LineProcessor = LineProcessor;
exports.parseResultLine = parseResultLine;
exports.getMatchingFiles = getMatchingFiles;
exports.findTestFiles = findTestFiles;
exports.parseArguments = parseArguments;
exports.fireOnce = fireOnce;
exports.merge = merge;
