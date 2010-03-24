restler: require('./restler/lib/restler')
process.mixin(require('./logging'))

exports.get: (url, options) ->
    options ||= {}
    options.parser ||= restler.parsers.json
    INFO "Performing GET $url"
    (success, error) ->
        restler.get(url, options).addListener('success', success).addListener 'error', (data, response) ->
            error(data.error, data.reason, response.statusCode)

