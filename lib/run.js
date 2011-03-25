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

var optparse = require('./extern/optparse/lib/optparse');
var async = require('async');
var sprintf = require('sprintf').sprintf;

var TEST_TIMEOUT = 15 * 1000;
var MAX_BUFFER = 512 * 1024;

/* Program version */
var VERSION = '0.1.0';

/* Default switches for the option parser. */
var DEFAULT_OPTIONS = [
  ['-h', '--help', 'Print this help'],
  ['-V', '--version', 'Print the version']
];

var OPTIONS = [
  ['-t', '--tests STRING', 'Whitespace separated list of tests to run'],
  ['-v', '--verbosity [NUMBER]', 'Test runner verbosity']
];

var total = 0;
var successes = 0;
var failures = 0;

var succeededTests = [];
var failedTests = [];

function equalsLine(str) {
  return  "===================="
        + " " + str + " "
        + "====================";
}

function executeTest(file, verbosity, callback) {
  var fileName = path.basename(file);

  printMsg(sprintf('Running test: %s', fileName), verbosity, 2);

  var args = ['common.js', file];
  var child = spawn(process.execPath, args);
  var stderr = [];
  var stdout = [];
  var dead = false;
  var timedOut = false;
  var timeoutId;

  child.stderr.on('data', function(chunk) {
    stderr.push(chunk);
  });

  child.stdout.on('data', function(chunk) {
    stdout.push(chunk);
  });

  child.on('exit', function(code) {
    clearTimeout(timeoutId);
    if (code !== 0) {
      sys.puts(equalsLine(sprintf("%s", file)));
      if (timedOut) {
        sys.puts('--- test timed out ---');
      }
      sys.puts('--- exit code: ' + code + ' ---');
      if (stderr.length > 0) {
        sys.puts('--- stderr ---');
        sys.puts(stderr.join(''));
      }
      if (stdout.length > 0) {
        sys.puts('--- stdout ---');
        sys.puts(stdout.join(''));
      }
      failures += 1;
      failedTests.push(file);
    }
    else {
      successes += 1;
      succeededTests.push(file);
    }
    total += 1;
    callback();
    return;
  });

  timeoutId = setTimeout(function() {
    timedOut = true;
    child.kill('SIGKILL');
  }, TEST_TIMEOUT);
}

function printTestResults(tests) {
  var i = 0;
  var testsLen = tests.length;

  for (i = 0; i < testsLen; i++) {
    test = tests[i];
    sys.puts(sprintf('     - %s', test));
  }
}

function printTestsResults() {
  sys.puts(equalsLine("Tests Complete"));
  sys.puts(sprintf("    Successes: %s", successes));
  printTestResults(succeededTests);
  sys.puts(sprintf("     Failures: %s", failures));
  printTestResults(failedTests);
  sys.puts("    ------------------");
  sys.puts("        Total: " + total);

  process.exit(failures);
}

function printMsg(msg, verbosity, minVerbosity) {
  if (verbosity >= minVerbosity) {
    sys.puts(msg);
  }
}

function runTests(tests, verbosity) {
  async.forEachSeries(tests, function(test, callback) {
    // Execute the test file and report any errors
    executeTest(test, verbosity, callback);
  },

  printTestsResults);
}

process.addListener('SIGINT', function() {
  printTestsResults();
});

function halt(parser) {
  parser.halt(parser);
  process.exit(0);
}

function getParser() {
  var switches = [];

  switches = switches.concat(DEFAULT_OPTIONS);
  switches = switches.concat(OPTIONS);
  var parser = new optparse.OptionParser(switches);

  parser.on('help', function() {
    sys.puts(parser.toString());
    halt(parser);
  });

  parser.on('version', function() {
    sys.puts(VERSION);
    halt(parser);
  });

  parser.on(function(opt) {
    sys.puts('No handler was defined for option: ' + opt);
    halt(parser);
  });

  parser.on('*', function(opt, value) {
    sys.puts('wild handler for ' + opt + ', value=' + value);
    halt(parser);
  });

  return parser;
}

var verbosity = 2;
var tests = [];

var run = function() {
  var p = getParser();
  p.banner = 'Usage: whiskey --test "files" [options]';

  p.on('verbosity', function(opt, value) {
    verbosity = value;
  });

  p.on('tests', function(opt, value) {
    if (value) {
      tests = value.split(' ');
    }
    else {
      tests = [];
    }
  });

  p.parse(process.argv);

  if (tests.length > 0) {
    runTests(tests, verbosity);
  }
  else {
    sys.puts(p.banner);
  }
}

exports.run = run;
