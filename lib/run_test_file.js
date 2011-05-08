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

var longStackTraces = require('./extern/long-stack-traces');
var sprintf = require('sprintf').sprintf;

var common = require('./common');
var testUtil = require('./util');
var coverage = require('./coverage');
var constants = require('./constants');

var oldStdoutWrite = process.stdout.write;
var oldStderrWrite = process.stderr.write;

var stdoutBuffer = '';
var stderrBuffer = '';

function bufferStdout(chunk) {
  stdoutBuffer += chunk;
}

function bufferStderr(chunk) {
  stderrBuffer += chunk;
}

if (process.argv.length < 6) {
  console.log('No enough argumentes provided');
  process.exit(1);
}

var testPath = process.argv[2];
var socketPath = process.argv[3];
var cwd = (!testUtil.isNullOrUndefined(process.argv[4])) ? process.argv[4] : null;
var libCovDir = (!testUtil.isNullOrUndefined(process.argv[5])) ? process.argv[5] : null;
var scopeLeaks = (!testUtil.isNullOrUndefined(process.argv[6])) ? process.argv[6] : null;
var chdir = (!testUtil.isNullOrUndefined(process.argv[7])) ? process.argv[7] : null;
var customAssertModule = (!testUtil.isNullOrUndefined(process.argv[8])) ? process.argv[8] : null;
var testInitFile = (!testUtil.isNullOrUndefined(process.argv[9])) ? process.argv[9] : null;
var timeout = (!testUtil.isNullOrUndefined(process.argv[10])) ? parseInt(process.argv[10], 0) : null;
var concurrency = (!testUtil.isNullOrUndefined(process.argv[11])) ? parseInt(process.argv[11], 10) : null;

testUtil.addToRequirePaths(testPath, cwd);

if (libCovDir) {
  require.paths.unshift(libCovDir);
}

if (customAssertModule) {
  var exportedFunctions = require(customAssertModule.replace(/$\.js/, ''));
  common.registerCustomAssertionFunctions(exportedFunctions);
}

if (chdir && path.existsSync(chdir)) {
  process.chdir(chdir);
}

var testFile = new common.TestFile(testPath, socketPath, testInitFile, timeout,
                                   concurrency, scopeLeaks);
testFile.runTests(function onTestFileEnd() {
  if (libCovDir && typeof _$jscoverage === 'object') {
    testFile._reportTestCoverage(_$jscoverage);
  }

  testFile._reportTestFileEnd();
});

process.on('uncaughtException', function(err) {
  testFile.addUncaughtException(err);
});
