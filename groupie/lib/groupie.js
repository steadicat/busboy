
var sys = require('sys');

/**
 * Executes a group of functions concurrently, invoking a callback when all have completed 
 * or when an error occurs. Errors occur when an executed function throws an unhandled
 * Error or when an error is passed to the callback.
 *
 * Results are returned to the callback in the order that they are declared. The results 
 * of functions that complete after an error have occurred are discarded.
 * 
 * group([function(done){ done(null, 1); }, function(done){ done(null, 2); }], function(err, results){});
 *   or
 * var g = group(function(err, results) {});
 * g.add(function(done) { done(null, 1); });
 * g.add(function(done) { done(null, 2); });
 * g.finalize();
 */
exports.group = function () {
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    var fxns = args.length > 0 && Array.isArray(args[0]) ? args.shift() : null;
    var open = fxns === null;
    var finalized = !open;

    fxns = fxns || [];

    var items_left_to_execute = fxns.length;
    var results = [];
    var errOccurred = false;
    var callGroupFunction = function(i, fxn) {
        var done = function(err, result) {
            if (errOccurred) return;
            if (err) { 
                errOccurred = true;
                return cb(err, results); 
            }
            results[i] = result;
            items_left_to_execute--;
            if (finalized && !items_left_to_execute)  {
                cb(null, results);
            }
        };
        
        try {
            fxn(done);
        } catch (err) {
            done(err, results);
        }
    };

    
    if (fxns.length === 0 && !open)
        cb(null, []);
    
    for ( var i = 0; i < fxns.length; i++) {
        callGroupFunction(i, fxns[i]);
    }
    
    if (open)
        return {
            add: function(fxn) {
                items_left_to_execute++;
                callGroupFunction(fxns.push(fxn) - 1, fxn);
            },
            finalize: function() {
                finalized = true;
                if (!errOccurred && !items_left_to_execute)
                    cb(null, results);
            }
        }
}
/**
 * Executes all functions in order, and a callback when all have completed
 * or when an error has been detected.
 *
 * The callback takes two arguments: an error (or null if no error occurred),
 * and the results of the chain operation, in order.
 */
exports.chain = function () {
    var args = Array.prototype.slice.call(arguments);
    var cb = args.pop();
    var fxns = args.length > 0 && Array.isArray(args[0]) ? args.shift() : null;
    var open = fxns === null;
    var finalized = !open;

    fxns = fxns || [];
    
    var pos = 0;
    var results = [];
    
    var hasMore = function() {
        return fxns.length > pos;
    };
    
    var callNext = function() {
        var done = function(err, result) {
            if (err) return cb(err, results);
            
            pos++;  
            results.push(result);
                
            if (hasMore())  
                callNext();
            else if (finalized)
                cb(null, results);
        };
        try {
            fxns[pos](done);
        } catch (err) {
            cb(err, results);
        }
    };
    
    if (fxns.length > 0)
        callNext();
    else if (!open)
        cb(null, []);

    if (open)
        return {
            add: function(fxn) {
                fxns.push(fxn);
                if (hasMore()) callNext();
            },
            finalize: function() {
                finalized = true;
                if (!hasMore()) cb(null, results);
            }
        }
}