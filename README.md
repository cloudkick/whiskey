Whiskey
=======

Whiskey is a simple test runner for NodeJS applications.

Features
========

* Each test file runs isolated in a separate process
* Support for running multiple tests in parallel (`--concurrency` option)
* Support for a test initialization function which is run before running the tests in a test file
* Support for a test file timeout
* setUp / tearDown function support
* Nicely formatted reports (colors!)
* Support for code coverage (cli reporter, html reporter)
* Support for reporting variables which have leaked into a global scope

Dependencies
===========

* optparse-js
* async
* sprintf
* rimraf
* magic-templates
* terminal
* [node-jscoverage](https://github.com/Kami/node-jscoverage) (only required if `--coverage` option is used)

Changes
=======

For changes please see [CHANGES.md](/cloudkick/whiskey/blob/master/CHANGES.md) file.

Installation
============

Install it using npm:
```
npm install whiskey
```

Usage
=====

    whiskey [options] --tests "<test files>"

#### Available options

 * **-t, --tests** - Whitespace separated list of test files to run
 * **-ti, --test-init-file** - A path to the initialization file which must export
 `init` function and it is called in a child process *before running the tests in
 each test file
 * **-c, --chdir** - An optional path to which the child process will chdir to before
 running the tests
 * **--timeout [NUMBER]** - How long to wait for tests to complete before timing
 out
 * **--failfast** - Stop running the tests on a first failure or a timeout
 * **--no-styles** - Don't use styles and colors
 * **--concurrency [NUMBER]** - Maximum number of tests which will run in parallel (defaults to 1)
 * **--quiet** - Don't print stdout and stderr
 * **--real-time** - Print stdout and stderr as soon as it comes in
 * **--test-reporter [cli,tap]** - Which test reporter to use (defaults to cli)
 * **--coverage** - Use this option to enable the test coverage
 * **--coverage-reporter [cli,html]** - Which coverage reporter to use (defaults to cli)
 * **--coverage-dir** - Directory where the coverage HTML report is saved
 * **--scope-leaks** - Record which variables were leaked into a global scope
 * **--scope-leaks-reporter [cli]** - Which scope leak reporter to use (defauls
   to cli)
 * **--debug** - Attach a Node debugger to the test process

Note: When specifying multiple test a list with the test paths must be quoted,
for example: `whiskey --tests "tests/a.js tests/b.js tests/c.js"`

Test File Examples
==================

A simple example (success):

``` javascript
var called = 0;

exports['test_async_one_equals_one'] = function(test, assert) {
  setTimeout(function() {
    assert.equal(1, 1);
    called++;
    test.finish();
  }, 1000);
}

exports['tearDown'] = function(test, assert) {
  assert.equal(called, 1);
  test.finish();
}
```

A simple example (failure):

``` javascript
exports['test_two_equals_one'] = function(test, assert) {
  assert.equal(2, 1);
  test.finish();
}
```

For more examples please check the `example/` folder.

Debugging
=========

If you want to debug your test, you can use the `--debug` option. This will
cause Whiskey to start the test process with the V8 debugger attached to it
and put you into the Node debugger prompt.

Whiskey will also by default set a breakpoint at the beginning of your test
file.

Note: This option can only be used with a single test file.

Troubleshooting
===============

### I use `long-stack-straces` module in my own code and all of the tests get reported as succeeded

Long stack traces modules intercepts the default Error object and throws a custom
one. The problem with this is that Whiskey internally relies on attaching the
test name to the `Error` object so it can figure out to which test the exception
belongs. long-stack-traces throws a custom Error object and as a consequence test
name attribute gets lost so Whiskey thinks your test didn't throw any exceptions.

The solution for this problem is to disable `long-stack-trace` module when running
the tests. This shouldn't be a big deal, because Whiskey internally already uses
`long-stack-traces` module which means that you will still get long stack traces
in the exceptions which were thrown in your tests.

### My test gets reported as "timeout" instead of "failure"

If your test gets reported as "timeout" instead of "failure" your test code most
likely looks similar to the one bellow:

```javascript
exports["test failure"] = function(test, assert){
  setTimeout(function() {
    throw "blaaaaah";
    test.finish();
  },200);
};
```

The problem with this is that if you run tests in parallel (`--concurrency` > 1)
and you don't use a custom assert object which gets passed to each test function,
Whiskey can't figure out to which test the exception belongs. As a consequence,
the test is reported as "timed out" and the exception is reported as "uncaught".

The solution for this problem is to run the tests in sequential mode (drop the
--concurrency option).
