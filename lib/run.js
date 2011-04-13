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

process.chdir(__dirname);

var fs = require('fs');
var sys = require('sys');
var path = require('path');
var spawn = require('child_process').spawn;
var DebuggerClient = require('_debugger').Client;

var async = require('async');
var sprintf = require('sprintf').sprintf;

var constants = require('./constants');
var parser = require('./parser');
var common = require('./common');
var testUtil = require('./util');
var coverage = require('./coverage');

var successes = 0;
var failures = 0;
var timeouts = 0;

var dateStart;

function startCodeCoverage(port, coverageData) {
  setTimeout(function() {
    var client =  new DebuggerClient();
    client.connect(port);

    client.once('ready', function() {
      // since we did debug-brk, we're hitting a break point immediately
      // continue before anything else.
      client.step('in', 1, function() {});
    });

    client.on('close', function() {
      console.log('\nprogram terminated');
    });

    client.on('unhandledResponse', function(res) {
      console.log('\r\nunhandled res:');
      console.log(res);
    });

    client.on('break', function(res) {
      coverageData.visited(res.body.script.name , res.body.sourceLine);
      client.step('in', 1, function() {});
    });
  }, 100);
}

/**
 * Spawn a new child, run a test file and report results.
 *
 * @param {String} cwd Full Directory where the whiskey binary was ran.
 * @param {String} chdir A directory to which the test runner chdirs before
 *                       running the tests.
 * @param {String} testInitFile Path to the test init file which should contain
 *                             "init" function which is executed before running
*                              the tests for each test file separately.
 * @param {String} filePath Full Absolute path to the test file.
 * @param {Boolean} failfast True to exit after first failure.
 * @param {Number} timeout Test file timeout (in milliseconds).
 * @param {Number} verbosity Test runner verbosity (0 = quiet, 3 = very verbose).
 * @param {Object} coverageData Object to store code coverage data in.
 * @param {Function} callback Callback which is called on completion.
 */
var executeTest = function(cwd, chdir, testInitFile, filePath, failfast, timeout,
                           verbosity, printStdout, printStderr, coverageData, callback) {
  var fileName = path.basename(filePath);
  /* TOOD: Randomly generate a high port */
  var debuggerPort = 5003;

  // Timeout for init, setUp and tearDown functions
  var functionsTimeout = (timeout / 100) * 25;

  testUtil.printMsg(sprintf('Running test file: %s', fileName), verbosity, 3);

  var args = ['run_test_file.js', filePath, cwd, chdir, testInitFile, functionsTimeout];
  if (coverageData !== false) {
    args.unshift('--debug-brk=' +  debuggerPort);
  }

  var child = spawn(process.execPath, args);
  var stderr = [];
  var stdout = [];
  var dead = false;
  var timedOut = false;
  var timeoutId;

  if (coverageData !== false) {
    startCodeCoverage(debuggerPort, coverageData);
  }

  child.stderr.on('data', function(chunk) {
    stderr.push(chunk);
  });

  child.stdout.on('data', function(chunk) {
    stdout.push(chunk);
  });

  child.on('exit', function(code) {
    var result, failedResult = {}, succeededResult = {};
    var stdoutJoined = stdout.join('');
    var stderrJoined = stderr.join('');

    sys.puts(fileName);

    if (!timedOut) {
      clearTimeout(timeoutId);

      result = common.parseResult(stderrJoined);
      succeededResult = result[0];
      failedResult = result[1];

      // Print test results
      common.reportSucceeded(succeededResult);
      common.reportFailed(failedResult);

      successes += Object.keys(succeededResult).length;
      failures += Object.keys(failedResult).length;
    }
    else {
      timeouts++;

      common.reportTimeout();
    }

    if (Object.keys(failedResult).length > 0 || timeouts > 0) {
      common.printStderr(stderrJoined);
      common.printStdout(stdoutJoined);
    }
    else {
      if (printStderr) {
        common.printStderr(stderrJoined);
      }

      if (printStdout) {
        common.printStdout(stdoutJoined);
      }
    }

    if (failfast && failedResult) {
      common.printTestsSummary(dateStart, successes, failures, timeouts);
    }

    callback(null);
    return;
  });

  timeoutId = setTimeout(function() {
    timedOut = true;
    child.kill('SIGKILL');
  }, timeout);
};

process.on('exit', function() {
  process.reallyExit(failures + timeouts);
});

var runTests = function(cwd, initFile, testInitFile, chdir, tests, failFast,
                        timeout, verbosity, printStdout, printStderr, generateCoverage) {
  dateStart = testUtil.getUnixTimestamp();
  var coverageData = false;;

  if (generateCoverage !== false) {
    coverageData = new coverage.CoverageCollector();
  }

  var executeTests = function() {
    async.forEachSeries(tests, function(test, callback) {
      executeTest(cwd, chdir, testInitFile, test, failFast, timeout, verbosity,
                  printStdout, printStderr, coverageData, callback);
    },

    function(err) {
      common.printTestsSummary(dateStart, successes, failures, timeouts);
      if (generateCoverage !== false) {
        console.error(coverageData._cov);
      }
    });
  };

  // Require initialization and run initialization function
  // Note 1: All the errors in the initialization file are ignored so don't
  // perform any assertions there.
  // Note 2: init function is executed in the main process so make sure not to
  // block there.
  if (initFile) {
    common.runInitFunction(initFile, executeTests);
  }
  else {
    executeTests();
  }
};

process.addListener('SIGINT', function() {
  common.printTestsSummary(dateStart, successes, failures, timeouts);
});

var run = function(cwd, argv) {
  var initFile = null;
  var testInitFile = null;
  var chdir = null;
  var failFast = false;
  var printStdout = false;
  var printStderr = false;
  var generateCoverage = false;
  var verbosity = constants.DEFAULT_VERBOSITY;
  var timeout = constants.DEFAULT_TEST_TIMEOUT;
  var tests = [];

  if ((argv === undefined) && (cwd instanceof Array)) {
    argv = cwd;
  }

  var p = parser.getParser();
  p.banner = 'Usage: whiskey --tests "files" [options]';

  p.on('init-file', function(opt, value) {
    if (value) {
      initFile = value;
    }
  });

  p.on('test-init-file', function(opt, value) {
    if (value) {
      testInitFile = value;
    }
  });

  p.on('chdir', function(opt, value) {
    if (value) {
      chdir = value;
    }
  });

  p.on('failfast', function(opt, value) {
    failFast = true;
  });

  p.on('verbosity', function(opt, value) {
    if (value) {
      verbosity = value;
    }
  });

  p.on('timeout', function(opt, value) {
    if (value) {
      timeout = value;
    }
  });

  p.on('tests', function(opt, value) {
    if (value) {
      tests = value.split(' ');
    }
    else {
      tests = [];
    }
  });

  p.on('print-stdout', function(opt, value) {
    printStdout = true;
  });

  p.on('coverage', function(opt, value) {
    generateCoverage = value;
  });

  p.on('print-stderr', function(opt, value) {
    printStderr = true;
  });

  p.parse(process.argv);

  if (tests.length > 0) {
    runTests(cwd, initFile, testInitFile, chdir, tests, failFast, timeout,
             verbosity, printStdout, printStderr, generateCoverage);
  }
  else {
    sys.puts(p.banner);
  }
};

exports.run = run;
