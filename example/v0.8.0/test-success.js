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

var Suite = require('../../lib/suite').Suite;


/* The success_suite will protect and help manage the global state for our two
 * tests.  It's before-code will ensure that the global state its managing
 * exists in a known state for our tests.  Note that, unlike earlier Whiskey
 * APIs, this version will invoke the before-method prior to invoking _each_ of
 * its testcases or sub-suites.
 *
 * Observe, however, that because our two tests have two different outcomes for
 * our global state, we do not configure any after methods at this scoping
 * level.
 *
 * We specify null for this suite's container because this is a top-level suite.
 */

var n;

var success_suite = new Suite(null)
success_suite.before(function() {
  console.log("success_suite before");
  n = 0;
});

success_suite.testcase(function() {
  console.log("success_suite case");
});

success_suite.testcase(function() {
  console.log("success_suite case 2");
  this.assert.equal(2, 2);
});


/* Our first test depends upon the global state, and mutates it.  As a result,
 * we place an after-method at this scoping level.
 *
 * For a test as simple as this, using an after-method is rather overkill.
 * However, it demonstrates the ability to separate tests with common shared
 * outcomes into separate sub-suites.  We can, for example, list any number of
 * test cases or even sub-suites at this level, and after each test or suite
 * completes, we want to ensure that, for example, n === 1.
 *
 * Observe that we specify success_suite as our containing suite.  This is a
 * convenience for the programmer, and is essentially a shortcut for the
 * following logic:
 *
 * var true_equals_true = new Suite(null);
 * success_suite.add_suite(true_equals_true);
 */

var true_equals_true = new Suite(success_suite);
true_equals_true.testcase(function() {
  console.log("true_equals_true testcase");
  this.assert.ok(n === 0);
  n++;
})

true_equals_true.after(function() {
  console.log("true_equals_true after");
  this.assert.ok(n === 1);
});


/* Our second test does not depend upon the global state, and does not mutate it.
 * Thus, it receives a separate after-method; in this case, we check to see that
 * global state remains intact.
 */

var two_plus_two_equals_four = new Suite(success_suite);
two_plus_two_equals_four.testcase(function() {
  console.log("two_plus_two testcase");
  this.assert.equal(2+2, 4);
});

two_plus_two_equals_four.after(function() {
  console.log("two_plus_two after");
  this.assert.equal(n, 0);
});


/* Above, we declared our subsuites statically as children of the success_suite
 * container.  However, static initialization of this relationship might not
 * always be preferable.  In such cases, you'll want to declare your suites as
 * top-level suites (e.g., with a null parent), and rely either on add_suite
 * (taking a single suite as a parameter) or on add_suites (taking an array of
 * suites as a parameter) to dynamically configure your object graphs.
 *
 * Here, we couple the two sub-suites above into the over-arching suite.
 * Otherwise, all the suites created above would be invoked as top-level
 * suites, and the success_suite.before method will not be invoked at the right
 * times.
 *
 * Note that adding subsuites is an idempotent operation.  Even though we
 * manually configured the relationships above in the new Suite()-statements,
 * it's completely safe to "re-add" them below.  You wouldn't normally do this,
 * however; you should pick one method or another.
 */

success_suite.add_suites([
    true_equals_true,
    two_plus_two_equals_four
]);

/* So now that we have our intended object graph, we now compile it into
 * compatible Whiskey infrastructure.  This compilation step is intended to be
 * temporary, providing a clean upgrade path from v0.8.0 to v1.0.0.
 */

success_suite.to(module);


/* Note that you can chain
 * add_suites() and to().
 */

