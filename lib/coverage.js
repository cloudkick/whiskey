/*
 * ReportCoverage/PopulateCoverage
 *    Copyright(c) TJ Holowaychuk <tj@vision-media.ca>
 *    (MIT Licensed)
 */

var sys = require('sys'),
    path = require('path'),
    fs = require('fs'),
    templates = require('magic-templates'),
    VERSION = require('./constants').VERSION;

var file_matcher = 'tests/\s.js';

Array.prototype.unique = function() {
  var a = [];
  var l = this.length;
  for(var i=0; i<l; i++) {
    for(var j=i+1; j<l; j++) {
      // If this[i] is found later in the array
      if (this[i] === this[j])
        j = ++i;
    }
    a.push(this[i]);
  }
  return a;
};


/**
 * Pad the given string to the maximum width provided.
 *
 * @param  {String} str
 * @param  {Number} width
 * @return {String}
 */

function lpad(str, width) {
    str = String(str);
    var n = width - str.length;
    if (n < 1) return str;
    while (n--) str = ' ' + str;
    return str;
}

/**
 * Pad the given string to the maximum width provided.
 *
 * @param  {String} str
 * @param  {Number} width
 * @return {String}
 */

function rpad(str, width) {
  str = String(str);
  var n = width - str.length;
  if (n < 1) return str;
  while (n--) str = str + ' ';
  return str;
}


/**
 * Total coverage for the given file data.
 *
 * @param  {Array} data
 * @return {Type}
 */

function coverage(data) {
  var hit = 0, miss = 0;
  for (var i = 0, len = data.source.length; i < len; ++i) {
    if (data.lines[i] === undefined) {
      miss++;
    }
    else {
      hit++;
    }
  }
  return [hit, miss];
}


function reportCoverage(results) {
  // Stats
  var sep = '   +------------------------------------------+----------+------+------+--------+',
      lastSep = '                                              +----------+------+------+--------+';
  sys.puts(sep);
  sys.puts('   | filename                                 | coverage | LOC  | SLOC | missed |');
  sys.puts(sep);
  for (var name in results.files) {
    var file = results.files[name];
    sys.print('   | ' + rpad(name, 40));
    sys.print(' | ' + lpad(file.coverage, 8));
    sys.print(' | ' + lpad(file.LOC, 4));
    sys.print(' | ' + lpad(file.SLOC, 4));
    sys.print(' | ' + lpad(file.totalMisses, 6));
    sys.print(' |\n');
  }
  sys.puts(sep);
  sys.print('     ' + rpad('', 40));
  sys.print(' | ' + lpad(results.coverage, 8));
  sys.print(' | ' + lpad(results.LOC, 4));
  sys.print(' | ' + lpad(results.SLOC, 4));
  sys.print(' | ' + lpad(results.totalMisses, 6));
  sys.print(' |\n');
  sys.puts(lastSep);
}


function populateCoverage(cov) {
  var results = {};

  results.LOC =
    results.SLOC =
    results.totalFiles =
    results.totalHits =
    results.totalMisses =
    results.coverage = 0;

  results.files = {};

  /* Aggregate data from all files */
  for (var testfile in cov) {
    for (var name in cov[testfile]) {
      var file = cov[testfile][name], file_stats;

      file_stats = results.files[name] || {
        name: name,
        totalHits: 0,
        totalMisses: 0,
        totalLines: 0,
        lines: [],
        source: null
      };

      file_stats.lines = file_stats.lines.concat(file.lines).unique();

      if (file_stats.source === null) {
        file_stats.source = file.source;
      }

      results.files[name] = file_stats;
    }
  }

  /* Calculate statistics */
  for (var name in results.files) {
    var file_stats = results.files[name], hitsmisses;

    // File level statistics
    hitsmisses = coverage(file_stats);
    file_stats.totalHits = hitsmisses[0];
    file_stats.totalMisses = hitsmisses[1];
    file_stats.totalLines = file_stats.totalHits + file_stats.totalMisses;
    file_stats.coverage = (file_stats.totalHits / file_stats.totalLines) * 100;
    file_stats.coverage = file_stats.coverage.toFixed(2);
    file_stats.LOC = file_stats.source.length;
    file_stats.SLOC = file_stats.totalLines;

    results.files[name] = file_stats;

    // Global statistic update
    results.totalHits += file_stats.totalHits;
    results.totalMisses += file_stats.totalMisses;
    results.totalFiles += 1;
    results.LOC += file_stats.LOC;
    results.SLOC += file_stats.SLOC;
  }

  /* Calculate covergage of tests */
  results.coverage = (results.totalHits / results.SLOC) * 100;
  results.coverage = results.coverage.toFixed(2);

  return results;
}

function htmlCoverage(save_directory, cov) {
  templates.setTemplatesDir(path.join(__dirname, 'assets'));
  templates.setDebug(false);

  var context = {
    version: VERSION,
    coverage: cov.coverage,
    cov: cov
  };

  var template = new templates.Template('whiskey.magic');

  template.load( function( err, template ) {
    if( err ) // load/parse errors (invalid filename, bad template syntax)
      sys.puts( err );
    else
    template.render( context, function( err, output ) {
      if( err ) // render errors (invalid filename in context variables, bad context variables)
        sys.puts( err );
      else
        fs.writeFileSync(path.join(save_directory, 'whiskey.html'), output.join("") );
    });
  });

}

exports.populateCoverage = populateCoverage;
exports.reportCoverage = reportCoverage;
exports.htmlCoverage = htmlCoverage;
