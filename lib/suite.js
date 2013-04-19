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

var _ = require('underscore');
var sprintf = require('sprintf').sprintf;


// The suite class encapsulates a collection of zero or more sub-suites,

var Suite = function(supersuite) {
  this.before_method = function() {};
  this.after_method = function() {};
  this.testcase_methods = [];
  this.subsuites = [];
  this.uniqueID = 0;

  if (supersuite !== null) {
    supersuite.add_suite(this);
  }

  // before() configures a suite with a function to call before invoking any
  // testcase methods and before all subsuites run.  These methods may
  // encounter assertion failures and may throw exceptions.
  //
  // If not specified explicitly, the default before() method simply returns
  // and performs no action of its own.
  this.before = function(f) {
    this.before_method = f;
  }

  // testcase() configures a function to be called when running tests.  Prior
  // to invoking the test case, the runner will call its suite's
  // before()-method, and upon completion of the test case, the corresponding
  // after()-method will be called.
  //
  // Test cases may encounter assertion failures, and may throw exceptions.
  this.testcase = function(f) {
    this.testcase_methods.push(f)
  }

  // after() configures a suite with a function to call after
  // invoking any testcase methods and after all subsuites run.
  // These methods may encounter assertion failures and may
  // throw exceptions.
  //
  // If not specified explicitly, the default after() method
  // simply returns and performs no action of its own.
  this.after = function(f) {
    this.after_method = f;
  }

  // add_suite() configures another suite to run as if it were a single
  // testcase for this suite.  This means that this suite's before()- and
  // after()-methods are invoked prior to and after completion of all
  // tests found in the indicated subsuite.
  // 
  // To illustrate, consider the following scenario:
  //
  //    outerSuite = new suite();
  //    outerSuite.before(function() {
  //      console.log("outerSuite before");
  //    }
  //    outerSuite.after(function() {
  //      console.log("outerSuite after");
  //    }
  //    outerSuite.testcase(function() {
  //      console.log("case 3");
  //    }
  //
  //    innerSuite = new suite(outerSuite);
  //    innerSuite.before(function() {
  //      console.log("innerSuite before");
  //    }
  //    innerSuite.after(function() {
  //      console.log("innerSuite after");
  //    }
  //    innerSuite.testcase(function() {
  //      console.log("case 1");
  //    }
  //    innerSuite.testcase(function() {
  //      console.log("case 2");
  //    }
  //
  // If we run this example, your console should show the following
  // execution trace:
  //
  //    outerSuite before
  //    innerSuite before
  //    case 1
  //    innerSuite after
  //    innerSuite before
  //    case 2
  //    innerSuite after
  //    outerSuite after
  //    outerSuite before
  //    case 3
  //    outerSuite after
  this.add_suite = function(s) {
    if ( ! _.contains(this.subsuites, s) ) {
      this.subsuites.push(s);
    }
  }

  // add_suites() takes an array of subsuites to add to this suite.
  // It's essentially a convenience function wrapping add_suite().
  // See add_suite() for more details.
  this.add_suites = function(ss) {
    _.each(this.subsuites, function(s) {
      this.add_suite(s);
    }, this);
    return this;
  }

  // to() compiles the test object
  // graph into a form suitable for
  // the current version of
  // Whiskey's test runner.  It may
  // be safely chained from either
  // add_suite() or add_suites().
  this.to = function(mod) {
    this.testcases_to(mod);
  };

  // nextName() returns a unique name for a test.
  this.nextName = function() {
    this.uniqueID++;
    return sprintf("test_%d", this.uniqueID-1);
  }

  this.testcases_to = function(mod) {
    suite = this;
    _.each(this.testcase_methods, function(tc) {
      f = function(done, assert) {
        this.done = done;
        this.assert = assert;
        this.exception = null;

        (suite.before_method.bind(this))();
        try {
          (tc.bind(this))();
        }
        catch(e) {
          this.exception = e;
        }
        finally {
          (suite.after_method.bind(this))();
          if (this.exception !== null) {
            throw this.exception;
          }
          done();
        }
      };
      mod.exports[this.nextName()] = f;
    }, this);
  };
};

exports.Suite = Suite;

