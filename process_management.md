# Process management and test dependencies

## dependencies.json file

In this file you specify all the dependencies for your tests.

Example file: example/dependencies.json.

Valid `wait_for` values:

* none - Don't wait
* `stdout` - wait for a string on standard output
* `socket` - wait until a connection on the provided ip and port can be
  successfully established.

Default values:

* `log_file` - <cwd>/<name>.log
* `wait_for` - none
* `timeout` - 10 seconds
* `depends`- []

## Specifying dependencies in the test files

``` javascript
exports.dependencies = ['name1', 'name2'];
```

## Process manager command line tool

Command line tool can be used for:

* Verifying dependencies.json is correct
* Starting specified dependencies without running the tests. All the started
  processed are stopped on `SIGINT`.

### Usage

TODO
