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
 * How long to wait for a test file to complete.
 */
var DEFAULT_TEST_TIMEOUT = 15 * 1000;

var DEFAULT_CONCURRENCY = 100;

var DEFAULT_TEST_REPORTER = 'cli';

var DEFAULT_COVERAGE_REPORTER = 'cli';

/*
 * Program version.
 */
var VERSION = '0.3.0';

/*
 * Default test verbosity (1 = quiet, 2 = verbose, 3 = very verbose)
 */
var DEFAULT_VERBOSITY = 2;

var INIT_FUNCTION_NAME = 'init';

var TEARDOWN_FUNCTION_NAME = 'tearDown';

var SETUP_FUNCTION_NAME = 'setUp';

var DEFAULT_SOCKET_PATH = '/tmp/whiskey-parent.sock';

var SEPARATOR = '@+separator+@';
var END_MARKER = '@-end-@';

/*
 * Default switches for the option parser.
 */
var DEFAULT_OPTIONS = [
  ['-h', '--help', 'Print this help'],
  ['-V', '--version', 'Print the version']
];

/*
 * Other options for the option parser.
 */
var OPTIONS = [
  ['-t', '--tests STRING', 'Whitespace separated list of tests to run'],
  ['-ti', '--test-init-file STRING', 'An initialization file which is run before each test file'],
  ['-c', '--chdir STRING', 'Directory to which each test process chdirs before running the tests'],
  ['-v', '--verbosity [NUMBER]', 'Test runner verbosity'],
  ['', '--timeout [NUMBER]', 'How long to wait (ms) for a test file to complete before timing out'],
  ['', '--concurrency [NUMBER]', 'Maximum number of tests which will run in parallel'],

  ['', '--custom-assert-module STRING', 'Absolute path to a module with custom assert methods'],

  ['', '--print-stdout', 'Print data which was sent to stdout'],
  ['', '--print-stderr', 'Print data which was sent to stderr'],

  ['', '--test-reporter STRING', 'Rest reporter type (cli or tap)'],

  ['', '--coverage', 'Enable test coverage'],
  ['', '--coverage-reporter STRING', 'Coverage reporter type (text, html)'],
  ['', '--coverage-dir STRING', 'Directory where the HTML coverage report is saved']

];

exports.DEFAULT_TEST_TIMEOUT = DEFAULT_TEST_TIMEOUT;
exports.DEFAULT_CONCURRENCY = DEFAULT_CONCURRENCY;
exports.DEFAULT_TEST_REPORTER = DEFAULT_TEST_REPORTER;
exports.DEFAULT_COVERAGE_REPORTER = DEFAULT_COVERAGE_REPORTER;

exports.VERSION = VERSION;
exports.DEFAULT_VERBOSITY = DEFAULT_VERBOSITY;
exports.INIT_FUNCTION_NAME = INIT_FUNCTION_NAME;
exports.SETUP_FUNCTION_NAME = SETUP_FUNCTION_NAME;
exports.TEARDOWN_FUNCTION_NAME = TEARDOWN_FUNCTION_NAME;
exports.DEFAULT_SOCKET_PATH = DEFAULT_SOCKET_PATH;
exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
exports.OPTIONS = OPTIONS;

exports.SEPARATOR = SEPARATOR;
exports.END_MARKER = END_MARKER;
