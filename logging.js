(function(){
  var LEVEL, LEVELS, log, sys;
  sys = require('sys');
  LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3
  };
  LEVEL = LEVELS.DEBUG;
  log = function(level, s, data) {
    if ((typeof data !== "undefined" && data !== null)) {
      s += ' ' + sys.inspect(data);
    }
    if (LEVELS[level] >= LEVEL) {
      return sys.log(("[" + level + "] " + s));
    }
  };
  exports.DEBUG = (exports.debug = function(s, data) {
    return log('DEBUG', s, data);
  });
  exports.LOG = (exports.log = (exports.INFO = (exports.info = function(s, data) {
    return log('INFO', s, data);
  })));
  exports.WARNING = (exports.warning = function(s, data) {
    return log('WARNING', s, data);
  });
  exports.ERROR = (exports.error = function(s, data) {
    return log('ERROR', s, data);
  });
})();
