var fs = require('fs');
var path = require('path');
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

function ProcessManager(config) {
  this._processes = [];
}


/**
 * Inspect the config, make sure all the options are valid and return a cleaned
 * config object.
 *
 * @return {Object} Cleaned config, object with which we can work.
 */
ProcessManager.prototype.verifyConfig = function(config) {
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

ProcessManager.prototype._getLogFilePath = function(name, logFile) {
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
ProcessManager.prototype.findDependencies = function(testPaths, callback) {
  // TODO
};

/**
 * @param {Function} callback Callback called when all the processes have
 * started.
 */
ProcessManager.prototype.run = function(callback) {
  var ops = [];
  // TODO async.auto
};

/**
 * Stop all the running processes.
 */
ProcessManager.prototype.stop = function(callback) {
  async.forEach(this._processes, this._stopProcess.bind(this), callback);
};

ProcessManager.prototype._runProcess = function(options, callback) {
  var self, args = options.cmd, obj;

  function writeToLog(stream, chunk) {
    stream.write(chunk, 'utf8');
  }

  function handleTimeout(obj, callback) {
    self._stopProcess(obj, callback);
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
      process.stdout.on('stderr', writeToLog.bind(null, obj.log_file_stream));

      obj.process = process;
    },

    function setTimeoutAndWaitFor(callback) {
      var timeoutId = setTimeout(handleTimeout.bind(null, obj, callback),
                                 options.timeout);
      this._processes.push(obj);

      // TODO
      // clearTimeout(timeoutId);
    }
  ], callback);
};

/**
 * @param {Object} process Process options object.
 * @param {Function} callback Callback called on completion.
 */
ProcessManager.prototype._stopProcess = function(process, callback) {
  process.log_file_stream.end('');
  process.process.kill('SIGTERM');
  process.stopped_at = util.getUnixTimestamp();
  callback();
};

ProcessManager.prototype._waitForStdout = function() {
  // TODO
};

ProcessManager.prototype._waitForSocket = function() {
  // TODO
};
