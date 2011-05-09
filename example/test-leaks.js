#!/usr/bin/env node

var assert = require('../lib/assert').getAssertModule();
var exec = require('child_process').exec;

var sprintf = require('sprintf').sprintf;

var cwd = process.cwd();
var cmd = sprintf('%s/bin/whiskey --tests %s/example/test-scope-leaks.js ' +
                  '--sequential --scope-leaks --timeout 2000', cwd, cwd);

exec(sprintf(cmd, cwd, cwd), function(err, stdout, stderr) {
  try {
    assert.match(stdout, /leaked variables/i);
    assert.match(stdout, /test_scope_leaks_on_success: a, b, c[^,]/i);
    assert.match(stdout, /test_scope_leaks_on_failure: d[^,]/i);
  }
  catch (err2) {
    process.exit(3);
  }

  process.exit(0);
});
