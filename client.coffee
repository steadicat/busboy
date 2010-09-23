restler = require('./restler/lib/restler')
logging = require('./logging')

exports.get = (url, options, callback) ->
    if not callback?
        callback = options
        options = null
    options or= {}
    options.parser or= restler.parsers.json
    logging.INFO "Performing GET #{url}"

    request = restler.get(url, options)
    request.on 'success', (data, response) ->
        callback(null, data, response)
    request.on 'error', (data, response) ->
        callback(data)

