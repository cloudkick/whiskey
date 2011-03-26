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

var printMsg = function(msg, verbosity, minVerbosity) {
  if (verbosity >= minVerbosity) {
    sys.puts(msg);
  }
};

var isNull = function(value) {
  if (value === null || (typeof value == 'string') && value === 'null') {
    return true;
  }

  return false;
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
exports.addToRequirePaths = addToRequirePaths;
exports.getUnixTimestamp = getUnixTimestamp;
exports.addCharacters = addCharacters;
