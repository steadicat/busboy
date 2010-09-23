var groupie = require('../../lib/groupie');

exports.testAllFunctionsCalled = function(assert) {
	assert.expect(1);
	
	var calls = 0;
	
	// get the group started with only three functions
	var group = groupie.group(function(colors) {
		assert.equals(4, calls);
		assert.done();
	});
	
	group.add(function(done) { calls++; done(); });
	group.add(function(done) { calls++; done(); });
	group.add(function(done) { calls++; done(); });
   	group.add(function(done) { calls++; done(); }); 
	
	// calling finalize tells the group that no more functions
	// will be added -- the callback can now be invoked
	group.finalize();
}

exports.testResults = function(assert) {
	assert.expect(2);
	
	// serial execution will take at least 900ms, but this is concurrently
	// executed so it should take ~300ms
	var started = new Date();

	var group = groupie.group(function(err, colors) {
		assert.ok(new Date() - started < 350);
		assert.same(['red', 'green', 'blue', 'yellow'], colors);
		assert.done();
	});
	
	group.add(function(done) {  setTimeout(function() { done(null, 'red'); }, 300); });
	group.add(function(done) {  setTimeout(function() { done(null, 'green'); }, 300); });
	group.add(function(done) {  setTimeout(function() { done(null, 'blue'); }, 300); });
	group.add(function(done) {  done(null, 'yellow'); });
	
	group.finalize();
};