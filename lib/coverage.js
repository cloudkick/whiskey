/*
 * ReportCoverage/PopulateCoverage
 *    Copyright(c) TJ Holowaychuk <tj@vision-media.ca>
 *    (MIT Licensed)
 */

var sys = require('sys'),
    path = require('path'),
    fs = require('fs'),
    templates = require('magic-templates'),
    rimraf = require('rimraf'),
    VERSION = require('./constants').VERSION;

var file_matcher = 'tests/\s.js';

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

function coverage(data, val) {
    var n = 0;
    for (var i = 0, len = data.lines.length; i < len; ++i) {
        if (data.lines[i] !== null && data.lines[i] == val) ++n;
    }
    return n;
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
        htmlName: name.replace('.js', '.html').replace(/\/|\\/g, '_'),
        totalHits: 0,
        totalMisses: 0,
        totalLines: 0,
        lines: null,
        source: null
      };

      if (file_stats.lines == null) {
        file_stats.lines = file.lines;
      }
      else {
        for (var i = 0; i < file.lines; i++) {
          if (file.lines[i]) file_stats.lines[i] += file.lines[i];
        }
      }

      if (file_stats.source === null) {
        file_stats.source = file.source;
      }

      results.files[name] = file_stats;
    }
  }

  /* Calculate statistics */
  for (var name in results.files) {
    var file_stats = results.files[name];

    // File level statistics
    file_stats.totalHits = coverage(file_stats, true);
    file_stats.totalMisses = coverage(file_stats, false);
    file_stats.totalLines = file_stats.totalHits + file_stats.totalMisses;
    file_stats.coverage = (file_stats.totalHits / file_stats.totalLines) * 100;
    file_stats.coverage = file_stats.coverage.toFixed(2);
    file_stats.LOC = file_stats.source.length;
    file_stats.SLOC = file_stats.totalLines;
    results.files[name] = file_stats;

    // Global statistic update
    results.totalHits += file_stats.totalHits;
    results.totalMisses += file_stats.totalMisses;
    results.totalFiles++;
    results.LOC += file_stats.LOC;
    results.SLOC += file_stats.SLOC;
  }

  /* Calculate covergage of tests */
  results.coverage = (results.totalHits / results.SLOC) * 100;
  results.coverage = results.coverage.toFixed(2);

  return results;
}

function _writeWhiskey(save_directory, cov) {
  var template = new templates.Template('whiskey.magic');

  var context = {
    version: VERSION,
    coverage: cov.coverage,
    cov: cov
  };

  template.load( function( err, template ) {
    if( err ) // load/parse errors (invalid filename, bad template syntax)
      sys.puts( err );
    else
    template.render( context, function( err, output ) {
      if( err ) // render errors (invalid filename in context variables, bad context variables)
        sys.puts( err );
      else
      fs.writeFile(path.join(save_directory, 'index.html'), output.join(""));
    });
  });
}

function _generateSourceMarkup(cov) {
  var rv = [], _class, data;


  for (var i = 1; i < cov.source.length; i++) {
    data = cov.lines[i.toString()];
    _class = 'pln';
    if (data != null) {
      if (parseInt(data) > 0)
        _class = 'stm run';
      if (parseInt(data) == 0)
        _class = 'stm mis';
    }
    rv.push({number: i, css: _class, source: cov.source[i-1]});
  }

  return rv;
}

function _writeWhiskeySources(save_directory, cov) {
  var template = new templates.Template('whiskey_source.magic');

  template.load(function(err, template) {
    if(err) { // load/parse errors (invalid filename, bad template syntax)
      sys.puts(err);
    }
    else {
      for (var name in cov.files) {
        var context = {
          version: VERSION,
          name: name,
          cov: cov.files[name],
          markup: _generateSourceMarkup(cov.files[name])
        };

        template.render(context, function(err, output) {
          if(err) { // render errors (invalid filename in context variables, bad context variables)
            sys.puts(err);
          }
          else {
            fs.writeFile(path.join(save_directory, cov.files[name].htmlName), output.join(''));
          }
        });
      }
    }
  });
}

function _copyFile(src, dst) {
  var oldFile = fs.createReadStream(src);
  var newFile = fs.createWriteStream(dst);
  newFile.once('open', function(fd) {
    require('util').pump(oldFile, newFile);
  });
}

function _copyAsset(asset, dest) {
  _copyFile(path.join(__dirname, 'assets', asset),
            path.join(dest, asset));
}

function _writeWhiskeyStaticFiles(dest) {
  _copyAsset('style.css', dest);
  _copyAsset('coverage_html.js', dest);
  _copyAsset('jquery-1.3.2.min.js', dest);
  _copyAsset('jquery.tablesorter.min.js', dest);
}

function htmlCoverage(save_directory, cov) {
  templates.setTemplatesDir(path.join(__dirname, 'assets'));
  templates.setDebug(false);

  /* Remove output directory */
  rimraf(save_directory, function(err) {
    fs.mkdir(save_directory, 0755, function() {
      _writeWhiskey(save_directory, cov);
      _writeWhiskeySources(save_directory, cov);
      _writeWhiskeyStaticFiles(save_directory);
    });
  });
}

exports.populateCoverage = populateCoverage;
exports.reportCoverage = reportCoverage;
exports.htmlCoverage = htmlCoverage;
