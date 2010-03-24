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
  log = function log(level, s, data) {
    if ((typeof data !== "undefined" && data !== null)) {
      s += ' ' + sys.inspect(data);
    }
    if (LEVELS[level] >= LEVEL) {
      return sys.log("[" + level + "] " + s);
    }
  };
  this.DEBUG = (this.debug = function debug(s, data) {
    return log('DEBUG', s, data);
  });
  this.LOG = (this.log = (this.INFO = (this.info = function info(s, data) {
    return log('INFO', s, data);
  })));
  this.WARNING = (this.warning = function warning(s, data) {
    return log('WARNING', s, data);
  });
  this.ERROR = (this.error = function error(s, data) {
    return log('ERROR', s, data);
  });
})();
