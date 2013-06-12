/*
 * Licensed to Cloudkick, Inc ('Cloudkick') under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * Cloudkick licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * coverage and populateCoverage are taken from expresso
 *  <https://github.com/visionmedia/expresso> which is MIT licensed.
 *  Copyright(c) TJ Holowaychuk <tj@vision-media.ca>
*/

var path = require('path');
var fs = require('fs');

/*
 * Convert an Istanbul __coverage__ object so it's JSON serializable
 */
function jscoverageFromIstanbulCoverage(coverage, chdir) {
  var jscov = {}, file, filename, hitCount, line, sid;

  chdir = chdir || process.cwd();

  for (file in coverage) {
    filename = path.relative(chdir, file);
    jscov[filename] = {};
    jscov[filename]['source'] = fs.readFileSync(file).toString().split('\n');

    for (line = 0; line < jscov[filename]['source'].length; ++line) {
      jscov[filename][line] = null;
    }

    for (sid in coverage[file].s) {
      if (coverage[file].s.hasOwnProperty(sid)) {
        hitCount = coverage[file].s[sid];
        if (typeof(coverage[file].statementMap[sid]) !== 'undefined') {
          line = coverage[file].statementMap[sid].start.line;
          jscov[filename][line] = hitCount;
        } else {
          // somehow log an error here.  Recommendations welcome.
          // Can this error ever happen in the first place?
        }
      }
    }
  }

  return jscov;
}

function stringifyCoverage(cov, chdir) {
  var i, files, file, fileObj, source;
  var tmp = {}, coverageObj = {};

  cov = jscoverageFromIstanbulCoverage(cov, chdir);

  files = Object.keys(cov);

  for (i = 0; i < files.length; i++) {
    file = files[i];
    fileObj = cov[file];
    source = fileObj['source'];
    delete fileObj['source'];

    coverageObj[file] = {
      'lines': fileObj,
      'source': source
    };
  }

  return JSON.stringify(coverageObj);
}

/**
 * Total coverage for the given file data.
 *
 * @param  {Array} data
 * @return {Type}
 */
function coverage(data, type) {
  var comparisionFunc;
  var n = 0;

  function isCovered(val) {
    return (val > 0);
  }

  function isMissed(val) {
    return !isCovered(val);
  }

  if (type === 'covered') {
    comparisionFunc = isCovered;
  }
  else if (type === 'missed') {
    comparisionFunc = isMissed;
  }
  else {
    throw new Error('Invalid type: ' + type);
  }

  var len = Object.keys(data.lines).length;

  for (var i = 0; i < len; ++i) {
    if (data.lines[i] !== null && comparisionFunc(data.lines[i])) {
      ++n;
    }
  }

  return n;
}

function getEmptyResultObject() {
  var results = {};

  results.LOC = 0;
  results.SLOC = 0;
  results.totalFiles = 0;
  results.totalHits = 0;
  results.totalMisses = 0;
  results.coverage = 0;
  results.files = {};

  return results;
}

/**
 * @param {?Object} results Optional results object. If it's not provided it will be created.
 * @param {?Object} cov coverage object.
 */
function populateCoverage(results, cov) {
  var linesLen, testfile, name, file, fileStats;

  results = (!results) ? getEmptyResultObject() : results;

  /* Aggregate data from all files */
  for (testfile in cov) {
    for (name in cov[testfile]) {
      file = cov[testfile][name];

      fileStats = results.files[name] || {
        name: name,
        htmlName: name.replace('.js', '.html').replace('.java', '.html').replace(/\/|\\/g, '_'),
        totalHits: 0,
        totalMisses: 0,
        totalLines: 0,
        lines: null,
        source: null
      };

      if (fileStats.lines === null) {
        fileStats.lines = file.lines;
      }
      else {
        linesLen = file.lines.length;
        for (var i = 0; i < linesLen; i++) {
          if (file.lines[i] !== null) {
            if (fileStats.lines[i] === null) {
              fileStats.lines[i] = file.lines[i];
            }
            else {
              fileStats.lines[i] += file.lines[i];
            }
          }
        }
      }

      if (fileStats.source === null) {
        fileStats.source = file.source;
      }

      results.files[name] = fileStats;
    }
  }

  /* Calculate statistics */
  for (name in results.files) {
    fileStats = results.files[name];

    // File level statistics
    fileStats.totalHits = coverage(fileStats, 'covered');
    fileStats.totalMisses = coverage(fileStats, 'missed');
    fileStats.totalLines = fileStats.totalHits + fileStats.totalMisses;
    fileStats.coverage = (fileStats.totalHits / fileStats.totalLines) * 100;
    fileStats.coverage = (isNaN(fileStats.coverage)) ? 0 : fileStats.coverage.toFixed(2);
    fileStats.LOC = fileStats.source.length;
    fileStats.SLOC = fileStats.totalLines;
    results.files[name] = fileStats;

    // Global statistic update
    results.totalHits += fileStats.totalHits;
    results.totalMisses += fileStats.totalMisses;
    results.totalFiles++;
    results.LOC += fileStats.LOC;
    results.SLOC += fileStats.SLOC;
  }

  /* Calculate covergage of tests */
  results.coverage = (results.totalHits / results.SLOC) * 100;
  results.coverage = results.coverage.toFixed(2);
  return results;
}

/**
 * Read multiple coverage files and return aggregated coverage.
 */
function aggregateCoverage(files) {
  var i, len, file, content, results;
  var resultsObj = getEmptyResultObject();

  for (i = 0, len = files.length; i < len; i++) {
    file = files[i];
    content = JSON.parse(fs.readFileSync(file).toString());
    resultsObj = populateCoverage(resultsObj, content);
  }

  return resultsObj;
}



function installCoverageHandler() {
  var pid = process.pid;
  var coverageDirectory = process.env['COVERAGE_DIRECTORY'];
  var coveragePath = path.join(coverageDirectory, pid + '.json');

  function writeCoverage() {
    var coverage = {};

    if (typeof __coverage__ === 'object') {
      coverage[pid] = JSON.parse(stringifyCoverage(__coverage__));

      try {
        fs.writeFileSync(coveragePath, JSON.stringify(coverage), 'utf8');
      }
      catch (e) {}
    }

    process.exit();
  }

  if (coverageDirectory) {
    process.on('SIGUSR2', writeCoverage);
  }
}

exports.stringifyCoverage = stringifyCoverage;
exports.populateCoverage = populateCoverage;
exports.aggregateCoverage = aggregateCoverage;
exports.installCoverageHandler = installCoverageHandler;
