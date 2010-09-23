var groupie = require('../../lib/groupie');

exports.testAllFunctionsCalled = function(assert) {
	assert.expect(1);
	
	var calls = 0;

	var chain = groupie.chain(function(colors) {
		assert.equals(4, calls);
		assert.done();
	});

	chain.add(function(done) { calls++; done(); });
	chain.add(function(done) { calls++; done(); });
	chain.add(function(done) { calls++; done(); });
	chain.add(function(done) { calls++; done(); });
	
	chain.finalize();
}

exports.testResults = function(assert) {
	assert.expect(1);

	var chain = groupie.chain(function(err, colors) {
		assert.same(['red', 'green', 'blue', 'yellow'], colors);
		assert.done();
	});
	
	chain.add(function(done) { done(null, 'red'); });
	chain.add(function(done) { done(null, 'green'); });
	chain.add(function(done) { done(null, 'blue'); });
	chain.add(function(done) { done(null, 'yellow'); });
	
	chain.finalize();
}