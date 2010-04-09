(function(){
  exports.memoize = function memoize(f) {
    var cache, queues, wrapper;
    cache = {};
    queues = {};
    wrapper = function wrapper(arg) {
      return function(success, error) {
        var _a, args, err, succ, successful;
        if (arg in cache) {
          _a = cache[arg];
          successful = _a[0];
          args = _a[1];
          return (successful ? success : error).apply(null, args);
        } else if (arg in queues) {
          return queues[arg].push([success, error]);
        } else {
          queues[arg] = [[success, error]];
          succ = function succ() {
            var _b, _c, _d, callbacks;
            args = Array.prototype.slice.call(arguments, 0, arguments.length - 0);
            cache[arg] = [true, args];
            _b = queues[arg];
            for (_c = 0, _d = _b.length; _c < _d; _c++) {
              callbacks = _b[_c];
              callbacks[0].apply(null, args);
            }
            return delete queues[arg];
          };
          err = function err() {
            var _b, _c, _d, callbacks;
            args = Array.prototype.slice.call(arguments, 0, arguments.length - 0);
            cache[arg] = [false, args];
            _b = queues[arg];
            for (_c = 0, _d = _b.length; _c < _d; _c++) {
              callbacks = _b[_c];
              callbacks[1].apply(null, args);
            }
            return delete queues[arg];
          };
          return f(arg)(succ, err);
        }
      };
    };
    wrapper.flush = function flush() {
      cache = {};
      return cache;
    };
    return wrapper;
  };
})();
