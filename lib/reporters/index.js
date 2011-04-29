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

var sprintf = require('sprintf').sprintf;

var CliReporter = require('./cli').CliReporter;
var TapReporter = require('./tap').TapReporter;

var REPORTERS = {
  'cli': CliReporter,
  'tap': TapReporter
};

function getReporter(name, tests, options) {
  var availableReporters = Object.keys(REPORTERS);

  if (availableReporters.indexOf(name) === -1) {
    throw new Error(sprintf('Invalid reporter: %s', name));
  }

  return new REPORTERS[name](tests, options);
}

exports.getReporter = getReporter;
