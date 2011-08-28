Changes
=======

* 29.08.2011 - v0.4.2:
  * assert.ifError now also captures a stack trace
  * Don't set a first breakpoint at the beginning of the test file when using
    --debug option
  * User can now pass a reason / message to the test.skip() function
  * Add a new 'json' coverage reporter which writes a raw JSON coverage dump to
    a file
  * Add a new `--coverage-files` option which allows user to generate aggregated
    coverage report across multiple files.

* 11.07.2011 - v0.4.1:
  * Fix a bug with reporting coverage when multiple test files had the same
    name
  * Allow user to specify which tests in a test file are run using a glob
    pattern

* 15.06.2011 - v0.4.0:
  * Add experimental support for attaching Node debugger to the test process
    (`--debug` option)
  * Fix a bug in `assert.response`
  * Fix a bug with exiting prematurely in the option parser on Mac OS X
  * Default Whiskey communication socket path now contains a random component
  * `--print-stdout` and `--print-stderr` options have been replaced with the
    `--quiet` option
  * The tests now run in sequential mode by default (old behavior can be
    replicated by using the `--concurrency 100` option)
  * Fix a bug in scope leak reporting
  * Fix a bug in `assert.eql`

* 31.05.2011 - v0.3.4:
  * When reporting the test results print a whole path to the test file
    instead of just a file name
  * Add `--no-styles` option and only use styles and colors if the underlying
    terminal supports it
  * Don't patch `EventEmitter.on` and `EventEmitter.addListener` in the
    long-stack-traces library, because this masks original functions and breaks
    some functionality
  * Add support for skipping a test using `test.skip()` function
  * Allow user to directly pass in a list of test to run to the whiskey binary
    without using the --tests option

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
