/*
 * Copyright(c) TJ Holowaychuk <tj@vision-media.ca>
 * (MIT Licensed)
 */

function reportCoverage(cov) {
  // Stats
  print('\n   [bold]{Test Coverage}\n');
  var sep = '   +------------------------------------------+----------+------+------+--------+',
      lastSep = '                                              +----------+------+------+--------+';
  sys.puts(sep);
  sys.puts('   | filename                                 | coverage | LOC  | SLOC | missed |');
  sys.puts(sep);
  for (var name in cov) {
    var file = cov[name];
    if (Array.isArray(file)) {
      sys.print('   | ' + rpad(name, 40));
      sys.print(' | ' + lpad(file.coverage.toFixed(2), 8));
      sys.print(' | ' + lpad(file.LOC, 4));
      sys.print(' | ' + lpad(file.SLOC, 4));
      sys.print(' | ' + lpad(file.totalMisses, 6));
      sys.print(' |\n');
    }
  }
  sys.puts(sep);
  sys.print('     ' + rpad('', 40));
  sys.print(' | ' + lpad(cov.coverage.toFixed(2), 8));
  sys.print(' | ' + lpad(cov.LOC, 4));
  sys.print(' | ' + lpad(cov.SLOC, 4));
  sys.print(' | ' + lpad(cov.totalMisses, 6));
  sys.print(' |\n');
  sys.puts(lastSep);
  // Source
  for (var name in cov) {
    if (name.match(file_matcher)) {
      var file = cov[name];
      if ((file.coverage < 100) || !quiet) {
        print('\n   [bold]{' + name + '}:');
        print(file.source);
        sys.print('\n');
      }
    }
  }
}


function populateCoverage(cov) {
  cov.LOC =
    cov.SLOC =
    cov.totalFiles =
    cov.totalHits =
    cov.totalMisses =
    cov.coverage = 0;

  for (var name in cov) {
    var file = cov[name];
    if (Array.isArray(file)) {
      // Stats
      ++cov.totalFiles;
      cov.totalHits += file.totalHits = coverage(file, true);
      cov.totalMisses += file.totalMisses = coverage(file, false);
      file.totalLines = file.totalHits + file.totalMisses;
      cov.SLOC += file.SLOC = file.totalLines;
      if (!file.source) file.source = [];
      cov.LOC += file.LOC = file.source.length;
      file.coverage = (file.totalHits / file.totalLines) * 100;
      // Source
      var width = file.source.length.toString().length;
      file.source = file.source.map(function(line, i){
        ++i;
        var hits = file[i] === 0 ? 0 : (file[i] || ' ');
        if (!boring) {
          if (hits === 0) {
            hits = '\x1b[31m' + hits + '\x1b[0m';
            line = '\x1b[41m' + line + '\x1b[0m';
          } else {
            hits = '\x1b[32m' + hits + '\x1b[0m';
          }
        }
        return '\n     ' + lpad(i, width) + ' | ' + hits + ' | ' + line;
      }).join('');
    }
  }
  cov.coverage = (cov.totalHits / cov.SLOC) * 100;
}

exports.populateCoverage = populateCoverage;
exports.reportCoverage = reportCoverage;
