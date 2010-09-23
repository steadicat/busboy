(function() {
  var logging, restler;
  restler = require('./restler/lib/restler');
  logging = require('./logging');
  exports.get = function(url, options, callback) {
    var request;
    if (!(typeof callback !== "undefined" && callback !== null)) {
      callback = options;
      options = null;
    }
    options || (options = {});
    options.parser || (options.parser = restler.parsers.json);
    logging.INFO("Performing GET " + (url));
    request = restler.get(url, options);
    request.on('success', function(data, response) {
      return callback(null, data, response);
    });
    return request.on('error', function(data, response) {
      return callback(data);
    });
  };
})();
