(function() {
  var getCloudantMember;
  var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  };
  ({
    busboy: require('./index')
  });
  process.mixin(busboy.methods);
  process.mixin(busboy.logging);
  GET('/', function() {
    return this.respond({
      ok: true
    });
  });
  GET('/post/*', function(id) {
    return this.respond({
      ok: true,
      message: "I can tell you are looking for post $id."
    });
  });
  POST('/post/', function(args) {
    var _a;
    DEBUG("Received args", args);
    return (typeof args !== "undefined" && args !== null) && (typeof (_a = args.text) !== "undefined" && _a !== null) ? this.respond({
      ok: true,
      message: "Thank you for posting '$args.text'!"
    }) : this.error('bad_request', 'You have to post a text.', 400);
  });
  GET('/headers', function(id) {
    return this.respond({
      headers: this.request.headers
    });
  });
  process.mixin(busboy.utils);
  getCloudantMember = memoize(function(id) {
    return client.get("http://cloudant.cloudant.com/team/" + (id));
  });
  GET('/cloudant_member/*', function(id) {
    var success;
    success = __bind(function(data) {
      return this.respond(data);
    }, this);
    return getCloudantMember(id)(success, this.error);
  });
  busboy.start(8888);
})();
