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
var path = require('path');
var net = require('net');
var spawn = require('child_process').spawn;

var sprintf = require('sprintf').sprintf;
var async = require('async');
var Set = require('simplesets').Set;

var util = require('../util');

var VALID_WAIT_FOR_OPTIONS = {
  'none': {
    'required_options': new Set([]),
  },

  'stdout': {
    'required_options': new Set(['string']),
  },

  'socket': {
    'required_options': new Set(['ip', 'port'])
  }
};

var VALID_WAIT_FOR_OPTIONS_NAMES = Object.keys(VALID_WAIT_FOR_OPTIONS);

var DEFAULT_TIMEOUT = 10 * 1000;

var SOCKET_CONNECT_TIMEOUT = 2000;
var SOCKET_CONNECT_INTERVAL = 1000;

function ProcessRunner(config) {
  this._config = this.verifyConfig(config);
  this._processes = [];
}


/**
 * Inspect the config, make sure all the options are valid and return a cleaned
 * config object.
 *
 * @return {Object} Cleaned config, object with which we can work.
 */
ProcessRunner.prototype.verifyConfig = function(config) {
  var key, value, available = {}, waitForOptions, requiredOptions, missing, dependencies,
      cleaned = {};

  // Verify that all the specified dependencies are defined
  for (key in this._config) {
    if (this._config.hasOwnProperty(key)) {
      value = this._config[key];
      available[key] = true;

      if (!value.cmd) {
        throw new Error(sprintf('%s is missing "cmd" attribute!', key));
      }

      if (value.wait_for) {
        if (!VALID_WAIT_FOR_OPTIONS.hasOwnProperty(value.wait_for)) {
          throw new Error(sprintf('Invalid wait_for options "%s", valid' +
                                  ' options are: %s', value.wait_for,
                                  VALID_WAIT_FOR_OPTIONS_NAMES));
        }

        waitForOptions = new Set(Object.keys(value.wait_for));
        requiredOptions = VALID_WAIT_FOR_OPTIONS[value.wait_for];

        missing = requiredOptions.difference(waitForOptions).array();

        if (missing.length !== 0) {
          throw new Error(sprintf('Missing required option for "%s" ' +
                                  'wait_for. Required options are: %s', value.wait_for,
                                  Object.keys(requiredOptions.array())));
        }

      }
    }
  }

  // Verify dependencies exist
  for (key in this._config) {
    if (this._config.hasOwnProperty(key)) {
      value = this._config[key];
      dependencies = value.depends || [];

      dependencies.forEach(function(name) {
        if (!available.hasOwnProperty(name)) {
          throw new Error(sprintf('%s is depending on "%s" which is not' +
                                  ' defined', key, name));
        }
      });

      cleaned[key] = {};
      cleaned[key]['name'] = key;
      cleaned[key]['cmd'] = value.cmd;
      cleaned[key]['log_file'] = this._getLogFilePath(key, value.log_file);
      cleaned[key]['wait_for'] = value.wait_for || null;
      cleaned[key]['wait_for_options'] = (value.wait_for) ? value.wait_for_options : {};
      cleaned[key]['timeout'] = parseInt(value.timeout || DEFAULT_TIMEOUT, 10);
      cleaned[key]['depends'] = value.depends || [];

    }
  }

  return cleaned;
};

ProcessRunner.prototype._getLogFilePath = function(name, logFile) {
  var cwd = process.cwd();

  if (logFile) {
    return logFile;
  }

  return path.join(cwd, sprintf('%s.log', name));
};

/**
 * Scan the test files and find all the dependencies.
 * Note: This function also takes into affect the dependencies file.
 * For example, if test file "a.js" depends on "api_server" and "api_server"
 * depends on "cassandra", this function will return ['cassandra',
* 'api_server'].
 *
 * @return {Array} Array of dependencies.
 */
ProcessRunner.prototype.findDependencies = function(testPaths, callback) {
  // TODO
};

/**
 * @param {Function} callback Callback called when all the processes have
 * started.
 */
ProcessRunner.prototype.run = function(callback) {
  var key, value, ops = {}, name, dependencies, func;

  for (key in this._config) {
    if (this._config.hasOwnProperty(key)) {
      value = this._config[key];
      name = value.name;
      dependencies = value.dependencies;

      func = this._startProcess.bind(this, value);

      if (!value.dependencies) {
        ops[name] = func;
      }
      else {
        ops[name] = dependencies.concat([func]);
      }
    }
  }

  async.auto(ops, callback);
};

/**
 * Stop all the running processes.
 */
ProcessRunner.prototype.stop = function(callback) {
  async.forEach(this._processes, this._stopProcess.bind(this), callback);
};


/**
 * Start a single process.
 *
 * @param {Object} options Options.
 * @param {Function} callback Callback called when the process has been started
 * with (err).
 */
ProcessRunner.prototype._startProcess = function(options, callback) {
  var self, args = options.cmd, waitFor = options.wait_for,
      waitForOptions = options.wait_for_options, obj;

  function writeToLog(stream, chunk) {
    stream.write(chunk, 'utf8');
  }

  function handleTimeout(obj, callback) {
    self._stopProcess(obj, function() {
      callback(new Error(sprintf('Process "%s" failed to start in "%s" seconds.',
                                 options.name, options.timeout)));
    });
  }

  async.waterfall([
    function createDataStructure(fb, callback) {
      var logFileStream = fs.createWriteStream({'flags': 'w', 'encoding': 'utf8'});

      obj = {
        'log_file_stream': logFileStream,
        'started_at': util.getUnixTimestamp()
      };
    },

    function spawnProcess(callback) {
      var process = spawn(process.execPath, args);

      process.stdout.on('data', writeToLog.bind(null, obj.log_file_stream));
      process.stdout.on('data', writeToLog.bind(null, obj.log_file_stream));

      obj.process = process;
    },

    function setTimeoutAndWaitFor(callback) {
      var timeoutId;

      function wrappedCallback() {
        clearTimeout(timeoutId);
      }

      if (waitFor === 'none') {
        callback();
      }
      else if (waitFor === 'stdout' || waitFor === 'socket') {
        timeoutId = setTimeout(handleTimeout.bind(null, obj, callback),
                               options.timeout);

        this._waitForStdout(obj, waitForOptions, wrappedCallback);
      }

      this._processes.push(obj);
    }
  ], callback);
};

/**
 * @param {Object} process Process options object.
 * @param {Function} callback Callback called on completion.
 */
ProcessRunner.prototype._stopProcess = function(process, callback) {
  process.log_file_stream.end('');
  process.process.kill('SIGTERM');
  process.killed = true;
  process.stopped_at = util.getUnixTimestamp();
  callback();
};

/**
 * @param {Object} obj Process object.
 * @param {Object} options Options object.
 * @param {Function} callback Callback called when the matching string has been
 * found.
 */
ProcessRunner.prototype._waitForStdout = function(obj, options, callback) {
  var stdoutBuffer = '';

  obj.process.stdout.on('data', function onData(chunk) {
    stdoutBuffer += chunk;

    if (stdoutBuffer.indexOf(options.string) !== -1) {
      // Found matching string
      process.stdout.removeListener('data', onData);
      callback();
    }
  });
};

/**
 *
 * @param {Object} obj Process object.
 * @param {Object} options Options object.
 * @param {Function} callback Callback called when the connection has been
 * established.
 */
ProcessRunner.prototype._waitForSocket = function(obj, options, callback) {
  var host = options.host, port = options.port;

  function connect() {
    if (obj.killed) {
      return;
    }

    var socket = net.createConnection(port, host), timeoutId;

    timeoutId = setTimeout(function() {
      setTimeout(connect, 2000);
      socket.destroy();
    }, SOCKET_CONNECT_TIMEOUT);

    socket.on('connect', function(conn) {
      clearTimeout(timeoutId);
      socket.end();
      callback();
    });

    socket.on('error', function(err) {
      clearTimeout(timeoutId);
      setTimeout(connect, SOCKET_CONNECT_INTERVAL);
    });
  }

  connect();
};
