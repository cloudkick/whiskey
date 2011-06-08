var Client = require('_debugger').Client;

Client.prototype.setBreakpoint = function(target, line, callback) {
  var req = {
    command: 'setbreakpoint',
    arguments: { type: 'script',
                 target: target,
                 line: line
    }
  };

  this.req(req, function(res) {
    if (callback) {
      callback(res);
    }
  });
};

exports.Client = Client;
