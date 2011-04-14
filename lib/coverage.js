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

var DebuggerClient = require('_debugger').Client;

function CoverageCollector() {
  this._cov = {};
  this._path = [];
}

CoverageCollector.prototype.visited = function(file, line) {
  if (this._cov[file] === undefined) {
    this._cov[file] = {};
  }

  if (this._cov[file][line] === undefined) {
    this._cov[file][line] = 0;
  }

  this._cov[file][line]++;
};

function CoverageBuilder() {
  /* TOOD: Randomly generate a high port */
  this.debuggerPort = 5003;
}

CoverageBuilder.prototype.modifySpawnArgs = function(args) {
  args.unshift('--debug-brk=' +  this.debuggerPort);
  return args;
};

CoverageBuilder.prototype.start = function(coverageData) {
  var port = this.debuggerPort;
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
};

exports.CoverageBuilder = CoverageBuilder;
exports.CoverageCollector = CoverageCollector;
