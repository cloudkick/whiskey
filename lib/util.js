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
var sys = require('sys');
var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var sprintf = require('sprintf').sprintf;
var async = require('async');

var constants = require('./constants');
var errors = require('./errors');

var printMsg = function(msg, verbosity, minVerbosity) {
  if (verbosity >= minVerbosity) {
    sys.puts(msg);
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
    if (n < 1) return str;
    while (n--) str = ' ' + str;
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
  if (n < 1) return str;
  while (n--) str = str + ' ';
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

function parseResultLine(line) {
  // Returns a triple (end, fileName, resultObj)
  var startMarkerIndex, endMarkerIndex, testFileEndMarkerIndex;
  var coverageEndMarker, split, fileName, resultObj;

  testFileEndMarkerIndex = line.indexOf(constants.TEST_FILE_END_MARKER);
  coverageEndMarker = line.indexOf(constants.COVERAGE_END_MARKER);
  startMarkerIndex = line.indexOf(constants.TEST_START_MARKER);
  endMarkerIndex = line.indexOf(constants.TEST_END_MARKER);

  if (testFileEndMarkerIndex !== -1) {
    // end marker
    fileName = line.substring(0, testFileEndMarkerIndex);
    return [ true, fileName, null ];
  }
  else if (coverageEndMarker !== -1) {
    // coverage result
    split = line.split(constants.DELIMITER);
    resultObj = {
      'coverage': split[1].replace(constants.COVERAGE_END_MARKER, '')
    };

    return [ false, split[0], resultObj ];
  }
  else {
    // test result
    line = line.replace(constants.TEST_START_MARKER, '')
               .replace(constants.TEST_END_MARKER, '');
    split = line.split(constants.DELIMITER);
    resultObj = JSON.parse(split[1]);

    return [ null, split[0], resultObj ];
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

function findTestFiles(basePath, callback) {
  var testFiles = [];
  function getMatchingFiles(directory, callback) {
    fs.readdir(directory, function(err, files) {
      if (err) {
        callback();
        return;
      }

      async.forEach(files, function(file, callback) {
        var filePath = path.join(directory, file);
        fs.stat(filePath, function(err, stats) {
          if (err) {
            callback();
          }
          else if (stats.isDirectory()) {
            getMatchingFiles(filePath, callback);
          }
          else if (file.match(/\.js$/)) {
            testFiles.push(filePath);
            callback();
          }
          else {
            callback();
          }
        });
      }, callback);
    });
  }

  getMatchingFiles(basePath, async.apply(callback, null, testFiles));
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

exports.printMsg = printMsg;
exports.isNullOrUndefined = isNullOrUndefined;

exports.addToRequirePaths = addToRequirePaths;
exports.getUnixTimestamp = getUnixTimestamp;
exports.addCharacters = addCharacters;

exports.rpad = rpad;
exports.lpad = lpad;

exports.LineProcessor = LineProcessor;
exports.parseResultLine = parseResultLine;
exports.findTestFiles = findTestFiles;
exports.parseArguments = parseArguments;
