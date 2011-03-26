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
 * How long to wait for a test to complete.
 */
var DEFAULT_TEST_TIMEOUT = 15 * 1000;

/*
 * Program version.
 */
var VERSION = '0.1.0';

/*
 * Default test verbosity (1 = quiet, 2 = verbose, 3 = very verbose)
 */
var DEFAULT_VERBOSITY = 2;

/*
 * Delimited which are used when print child test results to stderr
 */
var OUTPUT_DELIMITER = '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-\n';
var SUCCEEDED_STRING = 'succeeded:';
var FAILED_STRING = 'failed:';
var TEST_NAME_DELIMITER = '@|@';
var ERROR_MESSAGE_DELIMITER = '@:@';

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
  ['-v', '--verbosity [NUMBER]', 'Test runner verbosity'],
  ['-f', '--fail', 'Exit after the first failure'],
  //['-c', '--concurency', 'Maximum number of childs to spawn at once']
  //['', '--timeouts', 'How long to wait for a test file to complete before timing out']
];

exports.DEFAULT_TEST_TIMEOUT = DEFAULT_TEST_TIMEOUT;
exports.VERSION = VERSION;
exports.DEFAULT_VERBOSITY = DEFAULT_VERBOSITY;
exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
exports.OPTIONS = OPTIONS;

exports.OUTPUT_DELIMITER = OUTPUT_DELIMITER;
exports.SUCCEEDED_STRING = SUCCEEDED_STRING;
exports.FAILED_STRING = FAILED_STRING;
exports.TEST_NAME_DELIMITER = TEST_NAME_DELIMITER;
exports.ERROR_MESSAGE_DELIMITER = ERROR_MESSAGE_DELIMITER;
