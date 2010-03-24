(function(){
  var restler;
  restler = require('./restler/lib/restler');
  process.mixin(require('./logging'));
  exports.get = function get(url, options) {
    options = options || {};
    options.parser = options.parser || restler.parsers.json;
    INFO("Performing GET " + url);
    return function(success, error) {
      return restler.get(url, options).addListener('success', success).addListener('error', function(data, response) {
        return error(data.error, data.reason, response.statusCode);
      });
    };
  };
})();
