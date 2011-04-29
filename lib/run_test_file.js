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

var longStackTraces = require('./extern/long-stack-traces');

var common = require('./common');
var testUtil = require('./util');

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

if (process.argv.length < 5) {
  console.log('No enough argumentes provided');
  process.exit(1);
}

var testPath = process.argv[2];
var cwd = (process.argv.length >= 4) ? process.argv[3] : null;
var timeout = (process.argv.length >= 5) ? parseInt(process.argv[4], 0) : null;
var concurrency = (process.argv.length === 6) ? parseInt(process.argv[5], 10) : null;

testUtil.addToRequirePaths(testPath, cwd);
testUtil.patchStdoutAndStderr(bufferStdout, bufferStderr);

function onTestsComplete(resultObj) {
  // Enrich result object with the process stdout and stderr
  testUtil.patchStdoutAndStderr(oldStdoutWrite, oldStderrWrite);
  resultObj.stdout = stdoutBuffer;
  resultObj.stderr = stderrBuffer;

  common.reportTestResults(null, resultObj, function onEnd() {
    process.exit();
  });
}

var testFile = new common.TestFile(testPath, timeout, concurrency);
testFile.runTests(onTestsComplete);

process.on('uncaughtException', function(err) {
  testFile.addUncaughtException(err);
});
