# Process Runner

Whiskey process runner can be used for starting all the dependencies for your
tests.

Example dependencies include, but are not limited to:

* databases,
* web servers
* other external services

Note: All the processes defined in the configuration file are managed by Whiskey
process runner which means they shouldn't deamonize and must run in the
foreground.

## Configuration File

`dependencies.json` file is used to specify all the dependencies for your tests.

Example file: example/dependencies.json.

Valid `wait_for` values:

* `none` - don't wait
* `stdout` - wait for a string on standard output or standard error
* `socket` - wait until a connection on the provided ip and port is successfully
  established

Default values:

* `log_file` - <cwd>/<name>.log
* `wait_for` - none
* `timeout` - 10 seconds
* `depends`- []

## Specifying Dependencies in the Test Files

``` javascript
exports.dependencies = ['name1', 'name2'];
```

## Process Manager Command Line Tool

Command line tool can be used for:

* Verifying dependencies.json is correct
* Starting specified dependencies without running the tests. All the started
  processed are stopped on `SIGINT`.

### Usage

### Verify configuration file

`whiskey-process-runner --configuration [file.json] --verify`

## Start all the processes defined in the configuration file

`whiskey-process-runner --configuration [file.json] --run`

### TODO

* Command line option for interactively generating configuration file
