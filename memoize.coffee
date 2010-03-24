exports.memoize: (f) ->
    cache: {}
    queues: {}
    (arg) ->
        (success, error) ->
            if arg in cache
                [successful, args]: cache[arg]
                (if successful then success else error).apply(null, args)
            else if arg in queues
                queues[arg].push([success, error])
            else
                queues[arg]: [[success, error]]
                succ: (args...) ->
                    cache[arg]: [true, args]
                    callbacks[0].apply(null, args) for callbacks in queues[arg]
                    delete queues[arg]
                err: (args...) ->
                    cache[arg]: [false, args]
                    callbacks[1].apply(null, args) for callbacks in queues[arg]
                    delete queues[arg]
                f(arg) succ, err

