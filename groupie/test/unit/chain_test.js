var groupie = require('../../lib/groupie');

exports.testAllFunctionsCalled = function(assert) {
	assert.expect(1);
	
	var calls = 0;
	var functions = [
		function(done) { calls++; done(); },
		function(done) { calls++; done(); },
		function(done) { calls++; done(); } 
	];
	
	groupie.chain(functions, function(colors) {
		assert.equals(3, calls);
		assert.done();
	});
}

exports.testResults = function(assert) {
	assert.expect(1);
	
	var functions = [
		function(done) { done(null, 'red'); },
		function(done) { done(null, 'green'); },
		function(done) { done(null, 'blue'); } 
	];
	
	groupie.chain(functions, function(err, colors) {
		assert.same(['red', 'green', 'blue'], colors);
		assert.done();
	});
};

exports.testNoFunctions = function(assert) {
    groupie.chain([], function(err, colors) {
        assert.ok(!err);
        assert.same([], colors);
        assert.done();
    });
};

exports.testNullResultsAreNotDiscarded = function(assert) {
	assert.expect(1);
	
	// order the results by setting a timeout. this "proves" concurrency.
	var functions = [
		function(done) {  done(null, 'red'); },
		function(done) {  done(null, null); },
		function(done) {  done(null, 'blue'); }
	];
	
	groupie.group(functions, function(err, colors) {
		assert.same(['red', null, 'blue'], colors);
		assert.done();
	});
};

exports.testUndefinedResultsNotDiscarded = function(assert) {
	assert.expect(1);
	
	// order the results by setting a timeout. this "proves" concurrency.
	var functions = [
		function(done) { done(null, 'red'); },
		function(done) { done(); },
		function(done) { done(null, 'blue'); },
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
	
	groupie.chain(functions, function(err, colors) {
		assert.ok(err);
		assert.equals('green', err.message);
		assert.done();
	});
};

exports.testResultsAvailableOnError = function(assert) {
	assert.expect(2);
	
	var functions = [
		function(done) { done(null, 'red'); },
		function(done) { done(new Error('green'), 'orange'); },
		function(done) { done(null, 'blue'); } 
	];
	
	groupie.chain(functions, function(err, colors) {
		assert.ok(err);
		assert.same(['red'], colors);
		assert.done();
	});
};