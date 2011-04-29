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

var fs = require('fs');

var sprintf = require('sprintf').sprintf;

var CliReporter = require('./cli').CliReporter;
var TapReporter = require('./tap').TapReporter;

var REPORTERS = {};

function getReporter(name, tests, options) {
  var availableReporters = Object.keys(REPORTERS);

  if (availableReporters.indexOf(name) === -1) {
    throw new Error(sprintf('Invalid reporter: %s. Valid reporters are: %s',
                            name, Object.keys(REPORTERS).join(', ')));
  }

  return new REPORTERS[name](tests, options);
}

function discover(reportersPath) {
  var i, files, file, filesLen, moduleName, exported;
  reportersPath = reportersPath || __dirname;
  files = fs.readdirSync(reportersPath);

  filesLen = files.length;
  for (i = 0; i < filesLen; i++) {
    file = files[i];
    moduleName = file.replace(/\.js$/, '');
    exported = require(sprintf('./%s', moduleName));

    if (exported.name && exported.klass) {
      REPORTERS[exported.name] = exported.klass;
    }
  }
}

if (Object.keys(REPORTERS).length === 0) {
  discover();
}

exports.getReporter = getReporter;
