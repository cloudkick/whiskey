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
var sys = require('sys');
var path = require('path');
var net = require('net');
var spawn = require('child_process').spawn;

var async = require('async');

var constants = require('./constants');
var parser = require('./parser');
var common = require('./common');
var testUtil = require('./util');
var reporters = require('./reporters/index');

function TestRunner(tests, reporter, verbosity) {
  this._tests = tests;
  this._reporter = reporter;
  this._verbosity = verbosity || constants.DEFAULT_VERBOSITY;

  this._server = null;
  this._testFilesData = {};

  this._completed = 0;
  this._completedTests = [];
}

TestRunner.prototype.runTests = function(testInitFile, chdir, timeout,
                                         concurrency, failFast) {
  var self = this;
  concurrency = concurrency || constants.DEFAULT_CONCURRENCY;
  timeout = timeout || constants.DEFAULT_TEST_TIMEOUT;

  function handleChildTimeout(child, filePath, callback) {
    var resultObj;
    if (!child.killed) {
      resultObj = {
        'tests': [],
        'stdout': '',
        'stderr': '',
        'timeout': true
      };

      child.kill('SIGTERM');
      self._reporter.handleTestFileComplete(filePath, resultObj);
      callback();
    }
  }

  function onBound() {
    self._reporter.handleTestsStart();

    async.forEachSeries(self._tests, function(filePath, callback) {
      var child = self._spawnTestProcess(filePath, testInitFile, chdir,
                                          timeout, concurrency);
      var timeoutId = setTimeout(async.apply(handleChildTimeout, child, filePath,
                                             callback), timeout);

      self._testFilesData[filePath] = {
        'callback': callback,
        'timeout_id': timeoutId
      };
    },

    function(err) {
      self._handleTestsCompleted();
    });
  }

  this._startServer(null, async.apply(this._handleConnection, this),
                    onBound);
};

TestRunner.prototype._spawnTestProcess = function(filePath, testInitFile,
                                                  chdir, timeout,
                                                  concurrency) {
  var self = this;
  var cwd = process.cwd();
  var runFilePath = path.join(__dirname, 'run_test_file');

  var args = [runFilePath, filePath, cwd, chdir, testInitFile, timeout,
              concurrency];

  this._reporter.handleTestFileStart(filePath);
  var child = spawn(process.execPath, args);
  return child;
};

TestRunner.prototype._addCompletedTest = function(filePath) {
  this._completed += 1;
  this._completedTests.push(filePath);
};

TestRunner.prototype._handleTestsCompleted = function() {
  var statusCode;

  this._stopServer();
  statusCode = this._reporter.handleTestsComplete();
  process.exit(statusCode);
};

TestRunner.prototype._handleConnection = function(runner, connection) {
  var data = '';
  var dataString, endMarkIndex, testFile, testFileCallback, testFileTimeoutId;

  function onEnd(data) {
    var resultObj = JSON.parse(data);
    var filePath = resultObj['file_path'];

    runner._reporter.handleTestFileComplete(filePath, resultObj);
    runner._addCompletedTest(filePath);

    testFile = runner._testFilesData[filePath];
    if (testFile) {
      clearTimeout(testFile['timeout_id']);
      testFile['callback']();
      delete runner._testFilesData[filePath];
    }
  }

  function onData(chunk) {
    data += chunk;

    dataString = data.toString();
    endMarkIndex = data.toString().indexOf(constants.END_MARKER);
    if (endMarkIndex !== -1) {
      onEnd(dataString.substring(0, endMarkIndex));
    }
  }

  function onError(err) {

  }

  connection.on('data', onData);
  connection.on('error', onError);
};

TestRunner.prototype._startServer = function(socketPath, connectionHandler,
                                             onBound) {
  socketPath = socketPath || constants.DEFAULT_SOCKET_PATH;
  this._server = net.createServer(connectionHandler);
  this._server.listen(socketPath, onBound);
};

TestRunner.prototype._stopServer = function() {
  this._server.close();
};

function run(cwd, argv) {
  if ((argv === undefined) && (cwd instanceof Array)) {
    argv = cwd;
  }

  var p = parser.getParser();
  p.banner = 'Usage: whiskey [options] --tests "files"';
  var options = parser.parseArgv(p, argv);

  if (options.tests && options.tests.length > 0) {
    options.tests = options.tests.split(' ');

    var reporterOptions = {
      'print_stdout': options['print-stdout'],
      'print_stderr': options['print-stderr']
    };

    var reporter = reporters.getReporter('cli', options['tests'],
                                         reporterOptions);
    var runner = new TestRunner(options['tests'], reporter,
                                options['fail-fast'], options['concurrency'],
                                options['timeout'], options['verbosity']);
    runner.runTests(options['test-init-file'], options['chdir'],
                    options['timeout'], options['concurrency'],
                    options['fail-fast']);
  }
  else {
    sys.puts(p.banner);
  }

  process.addListener('SIGINT', function onSigint() {
    runner._handleTestsCompleted();
  });
}

exports.run = run;
