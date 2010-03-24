sys: require('sys')

LEVELS: {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3
}

LEVEL: LEVELS.DEBUG

log: (level, s, data) ->
    s += ' ' + sys.inspect(data) if data?
    sys.log("[$level] $s") if LEVELS[level] >= LEVEL

this.DEBUG: this.debug: (s, data) -> log('DEBUG', s, data)
this.LOG: this.log: this.INFO: this.info: (s, data) -> log('INFO', s, data)
this.WARNING: this.warning: (s, data) -> log('WARNING', s, data)
this.ERROR: this.error: (s, data) -> log('ERROR', s, data)
