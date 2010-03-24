sys: require('sys')
http: require('http')
querystring: require('querystring')

Do: require('./do/lib/do')
client: require('./client')
memoize: require('./memoize').memoize
exports.logging: require('./logging')

process.mixin(exports.logging)

root: {}

addInnerHandler: (root, method, path, handler) ->
    if path.length
        if path[0] == '*' then path[0]: '_'
        root[path[0]] ||= {}
        addInnerHandler(root[path[0]], method, path.slice(1), handler)
    else
        WARNING "Handler for $method ${path.join('/')} overriden." if root[method]
        root[method]: handler

createHandler: (method, url, handler) ->
    addInnerHandler(root, method, url.split('/').slice(1), handler)

exports.methods: {
    GET: createHandler <- null, 'GET'
    POST: createHandler <- null, 'POST'
    PUT: createHandler <- null, 'PUT'
    DELETE: createHandler <- null, 'DELETE'
}

exports.utils: {
    Do: Do,
    client: client,
    memoize: memoize
}

callHandler: (handler, request, response, args) ->
    context: {
        request: request
        response: response
        respond: (json, code) -> response.writeJson(json, code)
        error: (error, reason, code) -> response.writeJsonError(error, reason, code)
    }
    if request.headers['content-type'] == 'application/x-www-form-urlencoded'
        body: []
        request.addListener 'data', (chunk) ->
            body.push chunk
        request.addListener 'end', () ->
            args.push querystring.parse body.join ''
            handler.apply(context, args)
    else
        handler.apply(context, args)

class JsonError extends Error
    constructor: (error, reason, code) ->
        @error: error
        @reason: reason
        @code: code or 500
        super(reason)

class NotFound extends JsonError
    constructor: () -> super 'not_found', 'Nothing found here.', 404
class MethodNotAllowed extends JsonError
    constructor: () -> super 'method_not_allowed', 'Method not allowed.', 405

handleRequest: (root, path, args, request, response) ->
    if path.length
        if root[path[0]]
            DEBUG "Found path ${path[0]}"
            handleRequest(root[path[0]], path.slice(1), args, request, response)
        else if root['_']
            DEBUG "Found wildcard for ${path[0]}"
            args.push(path[0])
            handleRequest(root._, path.slice(1), args, request, response)
        else
            WARNING "Path $path not found"
            throw new NotFound()
    else
        if root[request.method]
            DEBUG "Calling method $request.method"
            callHandler(root[request.method], request, response, args)
        else
            DEBUG "Method handler not found"
            throw new MethodNotAllowed()

server: (request, response) ->
    INFO "$request.method $request.url"
    path: request.url.split('/').slice(1)
    try
        handleRequest(root, path, [], request, response)
    catch e
        response.writeError(e)

exports.start: (port) ->
    port ||= 8888
    INFO "Started Busboy on port $port."
    http.createServer(server).listen(port)

process.addListener 'uncaughtException', (exception) ->
    ERROR "$exception.stack"

http.ServerResponse.prototype.writeJson: (json, code, headers) ->
    headers ||= {}
    headers['Content-Type'] ||= 'application/json'
    @writeHead code or 200, headers
    @write JSON.stringify json
    @close()

http.ServerResponse.prototype.writeJsonError: (error, reason, code, info) ->
    @writeJson({ error: error, reason: reason }, code or 500)

http.ServerResponse.prototype.writeError: (error) ->
    if error instanceof JsonError
        @writeJsonError(error.error, error.reason, error.code)
    else
        @writeJsonError('unknown', error.message, 500, error.stack)
        ERROR "$error.stack"
