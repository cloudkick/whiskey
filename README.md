Whiskey
=======

Whiskey is a simple test runner for NodeJS applications.

Features
========

* Each test file is run in a separate process
* Support for a test file timeout
* Support for a "failfast mode" (runner exits after a first failure / timeout)
* setUp / tearDown function support
* Support for a global initialization function which is run once before
  all the tests
* Support for a test initialization function which is run before running
  the tests in a test file
* Nicely formatted output (colors!)

TODO
====

* Support for "TAP" output (http://testanything.org/wiki/index.php/Main_Page)
* Add tests for the custom asserts commands

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

    whiskey [options] --tests <test files>

#### Available options

 **-t, --tests** - Whitespace separated list of test files to run  
 **-i, --init-file** - A path to the initialization file which must export `init`
 function which is called *once in the main process* before running the tests  
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

For examples, check the `example` folder.
