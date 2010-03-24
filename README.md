# Busboy

A microframework built on top of Node.js and CoffeeScript designed specifically for RESTful JSON APIs. Very early stages.

# Example

    busboy: require('./index')
    process.mixin(busboy.methods) # GET, POST, PUT, DELETE
    process.mixin(busboy.logging) # DEBUG, INFO, WARN, ERROR

    GET '/', () ->
        @respond { ok: true }

    GET '/post/*', (id) ->
        @respond { ok: true, message: "I can tell you are looking for post $id." }

    POST '/post/', (args) ->
        DEBUG "Received args", args
        if args? and args.text?
            @respond { ok: true, message: "Thank you for posting '$args.text'!" }
        else
            @error 'bad_request', 'You have to post a text.', 400

    GET '/headers', (id) ->
        @respond { headers: @request.headers }

    process.mixin(busboy.utils) # memoize, client...

    getCloudantMember: memoize (id) ->
        client.get("http://cloudant.cloudant.com/team/$id")

    GET '/cloudant_member/*', (id) ->
        success: (data) => @respond data
        getCloudantMember(id) success, @error

    busboy.start(8888)