var groupie = require('../../lib/groupie');

exports.testAllFunctionsCalled = function(assert) {
	assert.expect(1);
	
	var calls = 0;
	var functions = [
		function(done) { calls++; done(); },
		function(done) { calls++; done(); },
		function(done) { calls++; done(); } 
	];
	
	groupie.group(functions, function(err, colors) {
		assert.equals(3, calls);
		assert.done();
	});
}

exports.testResults = function(assert) {
	assert.expect(2);
	
	// serial execution will take at least 900ms, but this is concurrently
	// executed so it should take ~300ms
	var started = new Date();
	var functions = [
		function(done) {  setTimeout(function() { done(null, 'red'); }, 300); },
		function(done) {  setTimeout(function() { done(null, 'green'); }, 300); },
		function(done) {  setTimeout(function() { done(null, 'blue'); }, 300); },
	];
	
	groupie.group(functions, function(err, colors) {
		assert.ok(new Date() - started < 350);
		assert.same(['red', 'green', 'blue'], colors);
		assert.done();
	});
};

exports.testNoFunctions = function(assert) {
    groupie.group([], function(err, colors) {
        assert.ok(!err);
        assert.same([], colors);
        assert.done();
    });
};

exports.testNullResultsAreNotDiscarded = function(assert) {
	assert.expect(1);

	var functions = [
		function(done) { done(null, 'red'); },
		function(done) { done(null, null); },
		function(done) { done(null, 'blue'); }
	];
	
	groupie.group(functions, function(err, colors) {
		assert.same(['red', null, 'blue'], colors);
		assert.done();
	});
};

exports.testUndefinedResultsAreNotDiscarded = function(assert) {
	assert.expect(1);
	
	var functions = [
		function(done) { done(null, 'red'); },
		function(done) { done(); },
		function(done) { done(null, 'blue'); }
	];
	
	groupie.group(functions, function(err, colors) {
		assert.same(['red', undefined, 'blue'], colors);
		assert.done();
	});
};

exports.testStopsOnError = function(assert) {
	assert.expect(2);
	
	var functions = [
		function(done) { done(null, 'red'); },
		function(done) { done(new Error('green'), 'orange'); },
		function(done) { done(null, 'blue'); }
	];
	
	groupie.group(functions, function(err, colors) {
		assert.ok(err);
		assert.equals('green', err.message);
		assert.done();
	});
};

exports.testResultsAvailableOnError = function(assert) {
	assert.expect(2);
	
	var functions = [
		function(done) {  done(null, 'red'); },
		function(done) {  setTimeout(function() { done(new Error('green')); }, 300); },
		function(done) {  setTimeout(function() { done(null, 'blue'); }, 600); } 
	];
	
	groupie.group(functions, function(err, colors) {
		assert.ok(err);
		assert.same(['red'], colors);
		assert.done();
	});
};