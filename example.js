(function(){
  var busboy, getCloudantMember;
  busboy = require('./index');
  process.mixin(busboy.methods);
  // GET, POST, PUT, DELETE
  process.mixin(busboy.logging);
  // DEBUG, INFO, WARN, ERROR
  GET('/', function() {
    return this.respond({
      ok: true
    });
  });
  GET('/post/*', function(id) {
    return this.respond({
      ok: true,
      message: "I can tell you are looking for post " + id + "."
    });
  });
  POST('/post/', function(args) {
    var _a;
    DEBUG("Received args", args);
    if ((typeof args !== "undefined" && args !== null) && (typeof (_a = args.text) !== "undefined" && _a !== null)) {
      return this.respond({
        ok: true,
        message: "Thank you for posting '" + args.text + "'!"
      });
    } else {
      return this.error('bad_request', 'You have to post a text.', 400);
    }
  });
  GET('/headers', function(id) {
    return this.respond({
      headers: this.request.headers
    });
  });
  process.mixin(busboy.utils);
  // memoize, client...
  getCloudantMember = memoize(function(id) {
    return client.get("http://cloudant.cloudant.com/team/" + id);
  });
  GET('/cloudant_member/*', function(id) {
    var success;
    success = (function(__this) {
      var __func = function(data) {
        return this.respond(data);
      };
      return (function success() {
        return __func.apply(__this, arguments);
      });
    })(this);
    return getCloudantMember(id)(success, this.error);
  });
  busboy.start(8888);
})();
