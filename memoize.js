(function() {
  var __slice = Array.prototype.slice;
  exports.memoize = function(f) {
    var cache, queues, wrapper;
    cache = {};
    queues = {};
    wrapper = function(arg) {
      return function(success, error) {
        var _a, _b, _c, _d, _e, args, err, succ, successful;
        if ((function(){ for (var _b=0, _c=cache.length; _b<_c; _b++) { if (cache[_b] === arg) return true; } return false; }).call(this)) {
          _a = cache[arg];
          successful = _a[0];
          args = _a[1];
          return (successful ? success : error).apply(null, args);
        } else if ((function(){ for (var _d=0, _e=queues.length; _d<_e; _d++) { if (queues[_d] === arg) return true; } return false; }).call(this)) {
          return queues[arg].push([success, error]);
        } else {
          queues[arg] = [[success, error]];
          succ = function() {
            var _f, _g, _h, callbacks;
            args = __slice.call(arguments, 0);
            cache[arg] = [true, args];
            _g = queues[arg];
            for (_f = 0, _h = _g.length; _f < _h; _f++) {
              callbacks = _g[_f];
              callbacks[0].apply(null, args);
            }
            return delete queues[arg];
          };
          err = function() {
            var _f, _g, _h, callbacks;
            args = __slice.call(arguments, 0);
            cache[arg] = [false, args];
            _g = queues[arg];
            for (_f = 0, _h = _g.length; _f < _h; _f++) {
              callbacks = _g[_f];
              callbacks[1].apply(null, args);
            }
            return delete queues[arg];
          };
          return f(arg)(succ, err);
        }
      };
    };
    wrapper.flush = function() {
      return (cache = {});
    };
    return wrapper;
  };
})();
