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

For changes please see `CHANGES` file.

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
 * **--concurrency [NUMBER]** - Maximum number of tests which will run in parallel (defaults to 100)
 * **--print-stdout** - Print data which was sent to stdout
 * **--print-stderr** - Print data which was sent to stderr
 * **--test-reporter [cli,tap]** - Which test reporter to use (defaults to cli)
 * **--coverage** - Use this option to enable the test coverage
 * **--coverage-reporter [cli,html]** - Which coverage reporter to use (defaults to cli)
 * **--coverage-dir** - Directory where the coverage HTML report is saved
 * **--scope-leaks** - Record which variables were leaked into a global scope
 * **--scope-leaks-reporter [cli]** - Which scope leak reporter to use (defauls
   to cli)

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
