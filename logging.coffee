sys = require('sys')

LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3
}

LEVEL = LEVELS.DEBUG

log = (level, s, data) ->
    s += ' ' + JSON.stringify(data) if data?
    sys.log("[#{level}] #{s}") if LEVELS[level] >= LEVEL

exports.DEBUG = exports.debug = (s, data) -> log('DEBUG', s, data)
exports.LOG = exports.log = exports.INFO = exports.info = (s, data) -> log('INFO', s, data)
exports.WARNING = exports.warning = (s, data) -> log('WARNING', s, data)
exports.ERROR = exports.error = (s, data) -> log('ERROR', s, data)
