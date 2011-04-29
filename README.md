Whiskey
=======

Whiskey is a simple test runner for NodeJS applications.

Features
========

* Each test file is run in a separate process
* Support for a test file timeout
* Support for a "failfast mode" (runner exits after a first failure / timeout)
* setUp / tearDown function support
* Support for a test initialization function which is run before running
  the tests in a test file
* Nicely formatted output (colors!)

TODO
====

* Support for "TAP" output (http://testanything.org/wiki/index.php/Main_Page)

Screenshot
==========
![Console output](https://img.skitch.com/20110326-1tmuf6xbax1m4gjy34fuch99q4.jpg)

Dependencies
===========

* optparse-js
* async
* sprintf

Changes
=======

* 29.04.2011 - v0.3.0:
 * Refactor most of the internals to make the code more readable and more easy
   to extend
 * Communication between main and child processes now takes place over a
   unix socket
 * Add support for "Reporter" classes
 * Removed the `--init-file` option

Note: The test format has changed and it is not backward compatible with
Whiskey 0.2.0.

Now each test gets passed in a special `test` object and a custom `assert`
module which must be used to perform assertions.

`exports['test_some_func'] = function(test, assert)`

...

* 15.04.2011 - v0.2.3:
  * Better reporting on a test file timeout
  * Properly report if a test file does not exist or some other
    uncaught exception was thrown
  * Fix a bug with output buffer not being fully flushed on exit
    on OS X
  * add --print-stdout and --print-stderr option

* 30.03.2011 - v0.2.2:
  * Add timeout support to the init, setUp and tearDown function -
   if the callback passed to one of those functions is not called in
   `timeout` milliseconds, an exception is thrown and test execution
   is aborted
  * Test timeout is now properly reported as a failure

* 27.03.2011 - v0.2.1:
  * Handle uncaughtExceptions better
  * Use lighter colors so test status output is more distinguishable
  * Fix bug with "cannot find module" exception not being properly reported
  * Add support for per-test file init function / file
  * Print stdout and stderr on failure

* 26.03.2011 - v0.2.0
  * Add support for the failfast mode (runner exists after a first failure)
  * User can specify custom test timeout by passing in the --timeout argument
  * Add support for a setUp and tearDown function
  * Add colors to the output
  * Now each test file must export all the test functions so the runner can
    iterate over them
  * Add support for a global initialization file / function (`init` function in
    this file is run before all the tests in a main process and can perform
    some kind of global initialization)
  * Add support for `--chdir` argument

* 25.03.2011 - v0.1.0
  * Initial release (refactor module out from Cast and move it into a separate
    project)

Installation
============

Install it using npm:
    npm install whiskey

Usage
=====

    whiskey [options] --tests "<test files>"

#### Available options

 **-t, --tests** - Whitespace separated list of test files to run
 **-ti, --test-init-file** - A path to the initialization file which must export
 `init` function and it is called in a child process *before running the tests in
 each test file*
 **-c, --chdir** - An optional path to which the child process will chdir to before
 running the tests
 **-f, --failfaist** - Use this option to exit upon first failure / timeout

Note: When specifying multiple test a list with the test paths must be quoted,
for example: `whiskey --tests "tests/a.js tests/b.js tests/c.js"`

Examples
========

A simple example (success):

``` javascript
var called = 0;

exports['test_async_one_equals_one'] = function(test, assert) {
  setTimeout(function() {
    assert.equal(1, 1);
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

For more examples please check the `example` folder.
