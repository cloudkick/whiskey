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

var optparse = require('./extern/optparse/lib/optparse');

var constants = require('./constants');

var halt = function(parser) {
  parser.halt(parser);
  process.exit(0);
};

var getParser = function() {
  var switches = [];

  switches = switches.concat(constants.DEFAULT_OPTIONS);
  switches = switches.concat(constants.OPTIONS);
  var parser = new optparse.OptionParser(switches);

  parser.on('help', function() {
    sys.puts(parser.toString());
    halt(parser);
  });

  parser.on('version', function() {
    sys.puts(constants.VERSION);
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
};

exports.getParser = getParser;
