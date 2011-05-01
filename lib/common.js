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
 *
 */

var sys = require('sys');
var path = require('path');
var net = require('net');

var sprintf = require('sprintf').sprintf;
var async = require('async');

var assert = require('./assert');
var constants = require('./constants');
var testUtil = require('./util');

var isValidTestFunctionName = function(name) {
  if (name.indexOf('test') === 0) {
    return true;
  }

  return false;
};

var runInitFunction = function(filePath, callback) {
  var testObj;
  var initModule = null;

  try {
    initModule = require(filePath);
  }
  catch (err) {
    // Invalid init file path provided
    callback();
    return;
  }

  if (initModule) {
    if (initModule.hasOwnProperty(constants.INIT_FUNCTION_NAME)) {
      try {
        initModule[constants.INIT_FUNCTION_NAME](callback);
        return;
      }
      catch (err2) {
        callback();
        return;
      }
    }
  }

  callback();
};

function Test(testName, testFunction) {
  this._testName = testName;
  this._testFunction = testFunction;

  this._finished = false;
  this._testObj = null;
  this._assertObj = null;

  this._status = null; // 'success' or 'failure'
  this._err = null; // only populated if _status = 'failure'
}

Test.prototype.run = function(callback) {
  var self = this;
  var finishCallbackCalled = false;

  function finishCallback() {
    callback(self.getResultObject());
  }

  function finishFunc() {
    if (finishCallbackCalled) {
      // someone called .finish() twice.
      return;
    }

    if (!self._status) {
      self._markAsSucceeded();
    }

    finishCallbackCalled = true;
    finishCallback();
  }

  this._testObj = this._getTestObject(finishFunc);
  this._assertObj = this._getAssertObject();

  try {
    this._testFunction(this._testObj, this._assertObj);
  }
  catch (err) {
    this._markAsFailed(err);
    finishFunc();
    return;
  }
};

Test.prototype._getTestObject = function(finishFunc) {
  var testObj = {
    'finish': finishFunc
  };

  return testObj;
};

Test.prototype._getAssertObject = function() {
  return assert.getAssertModule(this);
};

Test.prototype._markAsSucceeded = function() {
  this._finished = true;
  this._status = 'success';
};

Test.prototype._markAsFailed = function(err) {
  if (err.hasOwnProperty('test')) {
    delete err.test;
  }

  this._finished = true;
  this._err = err;
  this._status = 'failure';
};

Test.prototype.isRunning = function() {
  return !this._finished;
};

Test.prototype.beforeExit = function(handler) {
  this._beforeExitHandler = handler;
};

Test.prototype.getResultObject = function() {
  var resultObj = {
    'name': this._testName,
    'status': this._status,
    'error': this._err
  };

  return resultObj;
};

function TestFile(filePath, testInitFile, timeout, concurrency) {
  this._filePath = filePath;
  this._fileName = path.basename(filePath);
  this._testInitFile = testInitFile;
  this._timeout = timeout;
  this._concurrency = concurrency;

  this._tests = [];
  this._uncaughtExceptions = [];

  this._runningTest = null;
}

TestFile.prototype.addTest = function(test) {
  this._tests.push(test);
};

TestFile.prototype.runTests = function(callback) {
  var self = this;
  var i, test, exportedFunctions, exportedFunctionsNames, errName;
  var setUpFunc, tearDownFunc, setUpFuncIndex, tearDownFuncIndex;
  var testName, testFunc, testsLen;
  var callbackCalled = false;
  var testModule = this._fileName.replace(/\.js$/, '');

  try {
    exportedFunctions = require(testModule);
  }
  catch (err) {
    var errObj = {
      'error': err
    };

    if (err.message.indexOf(testModule) !== -1 &&
        err.message.match(/cannot find module/i)) {
        errObj.name = 'file_does_not_exist';
      }
      else {
        errObj.name = 'uncaught_exception';
      }

      callback(this.getResultObject(errObj));
      return;
  }

  exportedFunctionsNames = Object.keys(exportedFunctions);
  exportedFunctionsNames = exportedFunctionsNames.filter(isValidTestFunctionName);
  testsLen = exportedFunctionsNames.length;
  setUpFunc = exportedFunctions[constants.SETUP_FUNCTION_NAME];
  tearDownFunc = exportedFunctions[constants.TEARDOWN_FUNCTION_NAME];

  function handleEnd() {
    var resultObj;
    if (callbackCalled) {
      return;
    }

    resultObj = self.getResultObject(null);
    callbackCalled = true;
    callback(resultObj);
  }

  function onTestDone(test, callback) {
    self.addTest(test);
    callback();
  }

  async.series([
    // if test init file is present, run init function in it
    function(callback) {
      if (!self._testInitFile) {
        callback();
        return;
      }

      runInitFunction(self._testInitFile, callback);
    },

    // if setUp function is present, run it
    function(callback){
      if (!setUpFunc) {
        callback();
        return;
      }

      var test = new Test(constants.SETUP_FUNCTION_NAME, setUpFunc);
      test.run(async.apply(onTestDone, test, callback));
    },

    // Run the tests
    function(callback) {
      var queue;

      function taskFunc(task, _callback) {
        var test = task.test;
        self._runningTest = test;
        test.run(async.apply(onTestDone, task.test, _callback));
      }

      function onDrain() {
        callback();
      }

      queue = async.queue(taskFunc, self._concurrency);
      queue.drain = onDrain;

      for (i = 0; i < testsLen; i++) {
        testName = exportedFunctionsNames[i];
        testFunc = exportedFunctions[testName];

        test = new Test(testName, testFunc);
        queue.push({'test': test});
      }
    },

    // if tearDown function is present, run it
    function(callback) {
      if (!tearDownFunc) {
        callback();
        return;
      }

      var test = new Test(constants.TEARDOWN_FUNCTION_NAME, tearDownFunc);
      test.run(async.apply(onTestDone, test, callback));
    }
  ],

  function(err) {
    handleEnd();
  });
};

TestFile.prototype.addUncaughtException = function(err) {
  var test = err.test;

  if (test) {
    test._markAsFailed(err);
    test._testObj.finish();
    this.addTest(test);
    return;
  }
  else if (this._runningTest) {
    // User did not use our assert module or uncaughtException was thrown
    // somewhere in the async code.
    // Check which test is still running, mark it as failed and finish it.
    test = this._runningTest;
    test._markAsFailed(err);
    test._testObj.finish();
    this.addTest(test);
  }
  else {
    // Can't figure out the origin, just add it to the _uncaughtExceptions
    // array.
    this._uncaughtExceptions.push(err);
  }

};

TestFile.prototype.getResultObject = function(errObj) {
  var i, test, result, name, uncaughtException;
  var testsLen = this._tests.length;
  var uncaughtExceptionsLen = this._uncaughtExceptions.length;

  var resultObj = {
    'file_path': this._filePath,
    'file_name': this._fileName,
    'error': null,
    'timeout': false,
    'stdout': '',
    'stderr': '',
    'tests': {}
  };

  if (errObj) {
    resultObj.error = errObj;
    return resultObj;
  }

  for (i = 0; i < testsLen; i++) {
    test = this._tests[i];
    result = test.getResultObject();
    resultObj.tests[result.name] = result;
  }

  for (i = 0; i < uncaughtExceptionsLen; i++) {
    name = sprintf('uncaught_exception_%d', i + 1);
    uncaughtException = this._uncaughtExceptions[i];
    test = new Test(name, null);
    test._markAsFailed(uncaughtException);
    resultObj.tests[name] = test.getResultObject();
  }

  return resultObj;
};

function reportResults(socketPath, resultString, callback) {
  socketPath = socketPath || constants.DEFAULT_SOCKET_PATH;
  var connection = net.createConnection(socketPath);

  connection.on('connect', function onConnect() {
    connection.end(resultString);
  });

  connection.on('end', function onEnd() {
    callback();
  });
}

function registerCustomAssertionFunctions(functions) {
  assert.merge(null, functions);
}

exports.Test = Test;
exports.TestFile = TestFile;

exports.reportResults = reportResults;
exports.registerCustomAssertionFunctions = registerCustomAssertionFunctions;
