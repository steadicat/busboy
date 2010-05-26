(function(){
  var Do, JsonError, MethodNotAllowed, NotFound, addInnerHandler, callHandler, client, createHandler, handleRequest, http, include, memoize, querystring, root, server, sys;
  var __hasProp = Object.prototype.hasOwnProperty, __slice = Array.prototype.slice, __bind = function(func, obj, args) {
    return function() {
      return func.apply(obj || {}, args ? args.concat(__slice.call(arguments, 0)) : arguments);
    };
  }, __extends = function(child, parent) {
    var ctor = function(){ };
    ctor.prototype = parent.prototype;
    child.__superClass__ = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
  };
  sys = require('sys');
  http = require('http');
  querystring = require('querystring');
  Do = require('./do/lib/do');
  client = require('./client');
  memoize = require('./memoize').memoize;
  exports.logging = require('./logging');
  include = function(glob, module) {
    var _a, _b, key, value;
    _a = []; _b = module;
    for (key in _b) { if (__hasProp.call(_b, key)) {
      value = _b[key];
      _a.push((glob[key] = module[key]));
    }}
    return _a;
  };
  include(global, exports.logging);
  exports.include = include;
  root = {};
  addInnerHandler = function(root, method, path, handler) {
    if (path.length) {
      path[0] === '*' ? (path[0] = '_') : null;
      root[path[0]] = root[path[0]] || {};
      return addInnerHandler(root[path[0]], method, path.slice(1), handler);
    } else {
      if (root[method]) {
        WARNING(("Handler for " + method + " " + (path.join('/')) + " overriden."));
      }
      root[method] = handler;
      return root[method];
    }
  };
  createHandler = function(method, url, handler) {
    return addInnerHandler(root, method, url.split('/').slice(1), handler);
  };
  exports.methods = {
    GET: __bind(createHandler, null, ['GET']),
    POST: __bind(createHandler, null, ['POST']),
    PUT: __bind(createHandler, null, ['PUT']),
    DELETE: __bind(createHandler, null, ['DELETE'])
  };
  exports.utils = {
    Do: Do,
    client: client,
    memoize: memoize
  };
  callHandler = function(handler, request, response, args) {
    var body, context;
    context = {
      request: request,
      response: response,
      respond: function(json, code) {
        return response.writeJson(json, code);
      },
      error: function(error, reason, code) {
        if (error instanceof Error) {
          response.writeJsonError('unknown', error.message, 500, error.stack);
          return ERROR(("" + error.stack));
        } else {
          return response.writeJsonError(error, reason, code);
        }
      }
    };
    if (request.headers['content-type'] === 'application/x-www-form-urlencoded') {
      body = [];
      request.addListener('data', function(chunk) {
        return body.push(chunk);
      });
      return request.addListener('end', function() {
        args.push(querystring.parse(body.join('')));
        return handler.apply(context, args);
      });
    } else {
      return handler.apply(context, args);
    }
  };
  JsonError = function(error, reason, code) {
    this.error = error;
    this.reason = reason;
    this.code = code || 500;
    JsonError.__superClass__.constructor.call(this, reason);
    return this;
  };
  __extends(JsonError, Error);

  NotFound = function() {
    NotFound.__superClass__.constructor.call(this, 'not_found', 'Nothing found here.', 404);
    return this;
  };
  __extends(NotFound, JsonError);

  MethodNotAllowed = function() {
    MethodNotAllowed.__superClass__.constructor.call(this, 'method_not_allowed', 'Method not allowed.', 405);
    return this;
  };
  __extends(MethodNotAllowed, JsonError);

  handleRequest = function(root, path, args, request, response) {
    if (path.length) {
      if (root[path[0]]) {
        DEBUG(("Found path " + (path[0])));
        return handleRequest(root[path[0]], path.slice(1), args, request, response);
      } else if (root['_']) {
        DEBUG(("Found wildcard for " + (path[0])));
        args.push(path[0]);
        return handleRequest(root._, path.slice(1), args, request, response);
      } else {
        WARNING(("Path " + path + " not found"));
        throw new NotFound();
      }
    } else {
      if (root[request.method]) {
        DEBUG(("Calling method " + request.method));
        return callHandler(root[request.method], request, response, args);
      } else {
        DEBUG("Method handler not found");
        throw new MethodNotAllowed();
      }
    }
  };
  server = function(request, response) {
    var path;
    INFO(("" + request.method + " " + request.url));
    path = request.url.split('/').slice(1);
    try {
      return handleRequest(root, path, [], request, response);
    } catch (e) {
      return response.writeError(e);
    }
  };
  exports.start = function(port) {
    port = port || 8888;
    INFO(("Started Busboy on port " + port + "."));
    return http.createServer(server).listen(port);
  };
  process.addListener('uncaughtException', function(exception) {
    return ERROR(("" + exception.stack));
  });
  http.ServerResponse.prototype.writeJson = function(json, code, headers) {
    headers = headers || {};
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    this.writeHead(code || 200, headers);
    this.write(JSON.stringify(json));
    return this.end();
  };
  http.ServerResponse.prototype.writeJsonError = function(error, reason, code, info) {
    var message;
    message = {
      error: error,
      reason: reason
    };
    (typeof info !== "undefined" && info !== null) ? (message.info = info) : null;
    return this.writeJson(message, code || 500);
  };
  http.ServerResponse.prototype.writeError = function(error) {
    if (error instanceof JsonError) {
      return this.writeJsonError(error.error, error.reason, error.code);
    } else {
      this.writeJsonError('unknown', error.message, 500, error.stack);
      return ERROR(("" + error.stack));
    }
  };
})();
