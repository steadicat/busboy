# Groupie

A simple flow control library for node.js for executing multiple functions as a group or in a chain, 
calling back when all functions have finished.

## Installation

    npm install groupie

## Usage
	
Use `group` or `chain` to execute your functions. Group executes all functions at once, 
and chain executes them one-by-one, in the declared order. Here's how it looks:

	var groupie = require('groupie');
	
	// the array of functions to execute. each calls the done function upon completion
	var fxns = [function(done) { done(); }, function(done) { done(); }];
	
	// execute functions concurrently, and callback when all functions have been called
	groupie.group(fxns, function(err, results) {
		if (err) throw new Error("An error occurred!");
		require('sys').puts("all functions have been executed");
	});
	
	// execute each one after the other, and callback when all functions have been called
	groupie.chain(fxns, function(err, results) {
		// ...
	});
	
### Your functions

Each of your functions must accept a callback (called `done` below), and invoke the callback 
when the function execution is complete. 

Here's a sample function, written to work with Groupie:
	
	function(done) {
		fs.rename('/tmp/foo.txt', '/tmp/bar.txt', function(err) {
			done(err, 'file renamed successfully');
		});
	}
	
If your function handles an error, then pass it to the callback in the first 
parameter (i.e. `done('oh noes!')`).  If no error occurs, pass a `null` error and an optional 
result to the callback (i.e. `done(null, 'all done!')`). The second parameter is discarded
if you provide an error.	
	
Note that the `done` callback uses the same signature as Node core library callbacks, so you can 
use the function callback as the Node callback. The above example could be rewritten as:

	function(done) {
		fs.rename('/tmp/foo.txt', '/tmp/bar.txt', done);
	}


### Your function results

The results of your function calls are available in second parameter of the group or chain 
callback. The results array of the values submitted by your functions in the `done` 
callback, in the same order that the functions are declared.

If the `done` method is called with a `null` parameter or no parameter, then `null` or
`undefined` will be returned with other function values to the callback.
	
	
## Leaving a group or chain "open"

Adding functions to a `group` or `chain` dynamically rather than declaring them all 
up front is easy:
	
	var groupie = require('groupie'),
	    puts = require('sys').puts;

	// if you don't specify any functions, the group remains 
	// open until you invoke the finalize function
	var group = groupie.group(function(err, colors) {
		// handle the results
	});
	
	// add some functions into the group
	group.add(function(done) { done(null, 'yellow'); });
	group.add(function(done) { done(null, 'blue'); });
	
	// close the group -- the callback can now be fired
	group.finalize();
	
Your function will be invoked immediately when added to a group, or if you're adding to a chain,
it will be pushed to the tail of the chain (to be executed last). 

	
## Handling errors

To notify groupie that an error has occurred, just pass the error to the function callback as
the first parameter. Your group or chain callback will be invoked with the error and the results 
collected up to that point. 

If you're using a chain, the next function in the chain will not be invoked. If you're using a group,
function executions will continue, but the group callback will be invoked with the error and the results,
while future results (and errors) will be discarded.

If an unhandled error occurs in a function, the error will be caught by Groupie and automatically
provided to your group or chain callback.
