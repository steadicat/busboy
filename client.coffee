restler: require('./restler/lib/restler')
logging: require('./logging')

exports.get: (url, options) ->
    options ||= {}
    options.parser ||= restler.parsers.json
    logging.INFO "Performing GET $url"
    (success, error) ->
        restler.get(url, options).addListener('success', success).addListener 'error', (data, response) ->
            error(data.error, data.reason, response.statusCode)

