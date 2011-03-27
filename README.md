Whiskey
=======

Whiskey is a simple test runner for NodeJS applications.

Features
========

* Each test file is run in a separate process
* Support for a test file timeout
* Support for a "failfast mode" (runner exits after a first failure)
* setUp / tearDown methods support
* Support for a global initialization file / function which is run before all
  the tests
* Nicely formatted output (colors!)

TODO
====

* Support for "TAP" output (http://testanything.org/wiki/index.php/Main_Page)
* Add tests for custom asserts commands

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

* 27.03.2011 - v0.2.1:
  * Handle uncaughtExceptions better
  * Use lighter colors so test status output is more distinguishable

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

    whiskey --tests <test files> [options]

Example
=======

For examples check the `example` folder.
