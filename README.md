Whiskey
=======

Whiskey is a simple test runner for NodeJS applications.

Features
========

* Each test file is run in a separate process
* Support for a test file timeout
* setUp / tearDown function support
* Support for a test initialization function which is run before running
  the tests in a test file
* Nicely formatted output (colors!)
* Support for test coverage
* Scope leaks reporting

TODO
====

* Also instrument code in the `node_modules` directory (need to modify
  node-jscoverage to ignore shebang lines)

Screenshots
==========
![Console output (CLI test reporter)](https://img.skitch.com/20110501-m613pgd1g6fwmmqsk63myqc3hq.jpg)
![Console output (TAP test reporter)](https://img.skitch.com/20110501-diktfnj1p2d836jb4tqfueiugx.jpg)
![Code coverage #1 (HTML coverage reporter)](https://img.skitch.com/20110501-raptfh2hi5pnmuxamumm3igris.jpg)
![Code coverage #2 (HTML coverage reporter)](https://img.skitch.com/20110501-tq97b5uutnxgh1bsc374a87gb1.jpg)
![Code coverage (CLI coverage reporter)](https://img.skitch.com/20110501-jp1wcjrprxt7rbw7xfb2bejh27.jpg)

Dependencies
===========

* optparse-js
* async
* sprintf
* rimraf
* magic-templates
* [node-jscoverage](https://github.com/Kami/node-jscoverage) (only required if `--coverage` option is used)

Changes
=======

* 17.05.2011 - v0.3.3:
  * Make test object a function and allow users to directly call this function
    to signal end of the test
    [Wade Simmons]
  * Add support for scope leaks reporting (`--scope-leaks` option)

* 04.05.2011 - v0.3.2:
  * Allow user to pass in `--encoding` and `--exclude` option to jscoverage
  * When a test file times out, print the results for all the tests in this file
    which didn't time out
  * Refactor some of the internals so the results are now reported back to the
    main process after each test completes instead of reporting them back when all
    the tests in a single file complete
  * Clear the timeout and report the tests result in the child exit handler and
    not after all the tests have called `.finish()`, because it's possible that
    user calls .finish() and blocks afterwards

* 02.05.2011 - v0.3.1:
 * Capture the child process stdout and stderr in the main process instead of
   monkey patching the `process.stdout` and `process.stderr` in the child
   process

* 01.05.2011 - v0.3.0:
 * Refactor most of the internals to make the code more readable and more easy
   to extend
 * Communication between the main and child processes now takes place over a
   unix socket
 * Add support for "Reporter" classes
 * Remove the `--init-file` option
 * User can now specify a maximum number of async tests which will run at the
   same time (`--concurrency [NUMBER]` option)
 * Add a new "TAP" test reporter class (`--test-reporter tap`)
 * Add test coverage support with support for text and HTML output (`--coverage` option)
 * User can now specify a module with custom assertion functions which are
   attached to the `assert` object and passed to the each test function
   (`--custom-assert-module MODULE_PATH`)

Note: The test format has changed and it is not backward compatible with
Whiskey 0.2.0.

Now each test gets passed in a special `test` object and a custom `assert`
module which must be used to perform assertions.

``` javascript
exports['test_some_func'] = function(test, assert) {
...
```

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

 * **-t, --tests** - Whitespace separated list of test files to run
 * **-ti, --test-init-file** - A path to the initialization file which must export
 `init` function and it is called in a child process *before running the tests in
 each test file
 * **-c, --chdir** - An optional path to which the child process will chdir to before
 running the tests
 * **--timeout [NUMBER]** - How long to wait for tests to complete before timing
 out
 * **--concurrency [NUMBER]** - Maximum number of tests which will run in parallel
 * **--print-stdout** - Print data which was sent to stdout
 * **--print-stderr** - Print data which was sent to stderr
 * **--test-reporter [cli,tap]** - Which test reporter to use (defaults to cli)
 * **--coverage** - Use this option to enable the test coverage
 * **--coverage-reporter [cli,html]** - Which coverage reporter to use (defaults to cli)
 * **--coverage-dir** - Directory where the coverage HTML report is saved

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

For more examples please check the `example/` folder.
