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

var util = require('util');
var path = require('path');
var fs = require('fs');

var rimraf = require('rimraf');
var templates = require('magic-templates');

var constants = require('./../../constants');
var CoverageReporter = require('./base').CoverageReporter;

function HtmlReporter(tests, options) {
  CoverageReporter.call(this, tests, options);

  if (!options['coverage-directory']) {
    throw new Error('Missing coverage-directory option');
  }

  this._coverageDirectory = this._options['coverage-directory'];

  templates.setTemplatesDir(path.join('../../', __dirname, 'assets'));
  templates.setDebug(false);
}

HtmlReporter.prototype._writeCoverage = function(cov) {
  var self = this;

  /* Remove output directory */
  rimraf(self._coverageDirectory, function(err) {
    fs.mkdir(self._coverageDirectory, 0755, function() {
      self._writeFile(cov);
      self._writeSourceFle(cov);
      self._writeStaticFiles();
    });
  });
};

HtmlReporter.prototype._writeFile = function _writeWhiskey(cov) {
  var self = this;
  var template = new templates.Template('whiskey.magic');

  var context = {
    version: constants.VERSION,
    coverage: cov.coverage,
    cov: cov
  };

  template.load(function(err, template) {
    if (err) {
      // load/parse errors (invalid filename, bad template syntax)
      console.log(err);
    }
    else {
      template.render(context, function(err, output) {
        if (err) {
          // render errors (invalid filename in context variables, bad context variables)
          console.log(err);
        }
        else {
          fs.writeFile(path.join(self._coverageDirectory, 'index.html'),
                       output.join(''));
        }
      });
    }
  });
};

HtmlReporter.prototype._writeSourceFle = function(cov) {
  var self = this;
  var template = new templates.Template('whiskey_source.magic');

  template.load(function(err, template) {
    if(err) {
      // load/parse errors (invalid filename, bad template syntax)
      console.log(err);
    }
    else {
      for (var name in cov.files) {
        var context = {
          version: constants.VERSION,
          name: name,
          cov: cov.files[name],
          markup: self._generateSourceMarkup(cov.files[name])
        };

        template.render(context, function(err, output) {
          if (err) {
            // render errors (invalid filename in context variables, bad context variables)
            console.log(err);
          }
          else {
            fs.writeFile(path.join(self._coverageDirectory,
                                   cov.files[name].htmlName),
                         output.join(''));
          }
        });
      }
    }
  });
};

HtmlReporter.prototype._generateSourceMarkup = function(cov) {
  var rv = [], _class, data;

  for (var i = 1; i < cov.source.length; i++) {
    data = cov.lines[i.toString()];
    _class = 'pln';
    if (data !== null) {
      if (parseInt(data, 10) > 0) {
        _class = 'stm run';
      }
      else if (parseInt(data, 10) === 0) {
        _class = 'stm mis';
      }
    }

    rv.push({number: i, css: _class, source: cov.source[i-1]});
  }

  return rv;
};

HtmlReporter.prototype._writeStaticFiles = function(dest) {
  this._copyAsset('style.css', dest);
  this._copyAsset('coverage_html.js', dest);
  this._copyAsset('jquery-1.3.2.min.js', dest);
  this._copyAsset('jquery.tablesorter.min.js', dest);
};

HtmlReporter.prototype._copyAsset = function(asset, dest) {
  this._copyFile(path.join(__dirname, 'assets', asset),
                 path.join(dest, asset));
};

HtmlReporter.prototype._copyFile = function(src, dst) {
  var oldFile = fs.createReadStream(src);
  var newFile = fs.createWriteStream(dst);

  newFile.once('open', function(fd) {
    util.pump(oldFile, newFile);
  });
};

exports.name = 'html';
exports.klass = HtmlReporter;
