// From jQuery.extend in the jQuery JavaScript Library v1.3.2
// Copyright (c) 2009 John Resig
// Dual licensed under the MIT and GPL licenses.
// http://docs.jquery.com/License
// Modified for node.js (formely for copying properties correctly)
process.mixin = function() {
  // copy reference to target object
  var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, source;

  // Handle a deep copy situation
  if ( typeof target === "boolean" ) {
    deep = target;
    target = arguments[1] || {};
    // skip the boolean and the target
    i = 2;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if ( typeof target !== "object" && !(typeof target === 'function') )
    target = {};

  // mixin process itself if only one argument is passed
  if ( length == i ) {
    target = GLOBAL;
    --i;
  }

  for ( ; i < length; i++ ) {
    // Only deal with non-null/undefined values
    if ( (source = arguments[i]) != null ) {
      // Extend the base object
      Object.getOwnPropertyNames(source).forEach(function(k){
        var d = Object.getOwnPropertyDescriptor(source, k);
        if (d.get) {
          target.__defineGetter__(k, d.get);
          if (d.set) {
            target.__defineSetter__(k, d.set);
          }
        }
        else {
          // Prevent never-ending loop
          if (target === d.value) {
            continue;
          }

          if (deep && d.value && typeof d.value === "object") {
            target[k] = process.mixin(deep,
              // Never move original objects, clone them
              source[k] || (d.value.length != null ? [] : {})
            , d.value);
          }
          else {
            target[k] = d.value;
          }
        }
      });
    }
  }
  // Return the modified object
  return target;
};

var sys       = require('sys'),
    http      = require('http'),
    uri       = require('./vendor/uri'),
    qs        = require('./vendor/querystring'),
    base64    = require('./vendor/base64'),
    x2j       = require('./vendor/xml2json'),
    yaml      = require('./vendor/yaml'),
    multipart = require('./multipartform');
    
function Request(url, options) {
  this.url = uri.parse(url);
  this.options = options;
  this.headers = process.mixin({
    'Accept': '*/*',
    'Host': this.url.domain,
    'User-Agent': 'Restler for node.js'
  }, options.headers || {});
  
  if (!this.url.path) this.url.path = '/'
  
  // set port and method defaults
  if (!this.url.port) this.url.port = (this.url.protocol == 'https') ? '443' : '80';
  if (!this.options.method) this.options.method = (this.options.data) ? 'POST' : 'GET';
  if (typeof this.options.followRedirects == 'undefined') this.options.followRedirects = true;
  
  // stringify query given in options of not given in URL
  if (this.options.query && !this.url.query) {
    if (typeof this.options.query == 'object') 
      this.url.query = qs.stringify(this.options.query);
    else this.url.query = this.options.query;
  }
  
  this._applyBasicAuth();
  
  this.client = this._getClient(this.url.port, this.url.domain);
  
  this._applySSL();
  
  if (this.options.multipart) this._createMultipartRequest();
  else this._createRequest();
}

Request.prototype = new process.EventEmitter();
process.mixin(Request.prototype, {
  _isRedirect: function(response) {
    return ([301, 302].indexOf(response.statusCode) >= 0);
  },
  _fullPath: function() {
    var path = this.url.path;
    if (this.url.anchor) path += '#' + this.url.anchor;
    if (this.url.query) path += '?' + this.url.query;
    return path;
  },
  _applySSL: function() {
    if (this.url.protocol == 'https') {
      try {
        this.client.setSecure("X509_PEM");
      } catch(e) {
        sys.puts('WARNING: SSL not supported in your version of node JS');
      }
    }
  },
  _applyBasicAuth: function() {
    // use URL credentials over options
    if (this.url.user) this.options.username = this.url.user;
    if (this.url.password) this.options.password = this.url.password;
    
    if (this.options.username && this.options.password) {
      var auth = base64.encode(this.options.username + ':' + this.options.password);
      this.headers['Authorization'] = "Basic " + auth;
    }
  },
  _getClient: function(port, host) {
    return this.options.client || http.createClient(port, host);
  },
  _responseHandler: function(response) {
    var self = this;
    
    if (this._isRedirect(response) && this.options.followRedirects == true) {
      try {
      var location = uri.resolve(this.url, response.headers['location']);
      this.options.originalRequest = this;
        request(location, this.options);
      } catch(e) {
        self._respond('error', '', 'Failed to follow redirect');
      }
    } else {
      var body = '';
      
      response.addListener('data', function(chunk) {
       body += chunk;
      });
      
      response.addListener('end', function() {
         if (self.options.parser) body = self.options.parser.call(response, body);
        
        if (parseInt(response.statusCode) >= 400) self._respond('error', body, response);
        else self._respond('success', body, response);
        
        self._respond(response.statusCode.toString().replace(/\d{2}$/, 'XX'), body, response);
        self._respond(response.statusCode.toString(), body, response);
        self._respond('complete', body, response);
      });
    }
  },
  _respond: function(type, data, response) {
    if (this.options.originalRequest) this.options.originalRequest.emit(type, data, response);
    else this.emit(type, data, response);
  },
  _makeRequest: function(method) {
	var self = this;
    // Support new and old interface for making requests for now
	var request;
    if (typeof this.client.request == 'function') {
	  request = this.client.request(method, this._fullPath(), this.headers);
    } else {
      method = method.toLowerCase();
      if (method == 'delete') method = 'del';
	  request = this.client[method](this._fullPath(), this.headers);
    }
	request.addListener("response", function(response) {
		self._responseHandler(response);
	});
	return request;
  },
  _createRequest: function() {
    if (typeof this.options.data == 'object') {
      this.options.data = qs.stringify(this.options.data);
      this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      this.headers['Content-Length'] = this.options.data.length;
    }
  
    this.request = this._makeRequest(this.options.method);
    if (this.options.data) this.request.write(this.options.data.toString(), this.options.encoding || 'utf8');
  },
  _createMultipartRequest: function() {
    this.headers['Content-Type'] = 'multipart/form-data; boundary=' + multipart.defaultBoundary;
    this.headers['Transfer-Encoding'] = 'chunked';
  
    this.request = this._makeRequest(this.options.method);
  },
  run: function() {
    var self = this;
    if (this.options.multipart) {
      multipart.send(this.request, this.options.data, function() {
        self.request.close();
      });
    } else {
		this.request.close();
    }
    return this;
  }
}); 

function shortcutOptions(options, method) {
  options = options || {};
  options.method = method;
  options.parser = options.parser || parsers.auto;
  return options;
}
    
function request(url, options) {  
  	return (new Request(url, options)).run();
}

function get(url, options) {
 return request(url, shortcutOptions(options, 'GET'));;
}

function post(url, options) {
  return request(url, shortcutOptions(options, 'POST'));
}

function put(url, options) {
  return request(url, shortcutOptions(options, 'PUT'));
}

function del(url, options) {
  return request(url, shortcutOptions(options, 'DELETE'));
}

var parsers = {
  auto: function(data) {
    var contentType = this.headers['content-type'];
    if (contentType) {
      if (contentType.indexOf('application/') == 0) {
        if (contentType.indexOf('json', 12) == 12)
          return parsers.json(data);
        if (contentType.indexOf('xml', 12) == 12)
          return parsers.xml(data);
        if (contentType.indexOf('yaml', 12) == 12)
          return parsers.yaml(data);
      }
    }

    // Data doesn't match any known application/* content types.
    return data;
  },
  xml: function(data) {
    return x2j.parse(data);
  },
  json: function(data) {
    return JSON.parse(data);
  },
  yaml: function(data) {
    return yaml.eval(data);
  }
}

function Service(defaults) {
  if (defaults.baseURL) {
   this.baseURL = defaults.baseURL;
   delete defaults.baseURL; 
  }
  
  this.defaults = defaults;
}

process.mixin(Service.prototype, {
  request: function(path, options) {
    return request(this._url(path), this._withDefaults(options));
  },
  get: function(path, options) {
    return get(this._url(path), this._withDefaults(options));
  },
  put: function(path, options) {
    return put(this._url(path), this._withDefaults(options));
  },
  post: function(path, options) {
    return post(this._url(path), this._withDefaults(options));
  },
  del: function(path, options) {
    return del(this._url(path), this._withDefaults(options));
  },
  _url: function(path) {
    if (this.baseURL) return uri.resolve(this.baseURL, path);
    else return path;
  },
  _withDefaults: function(options) {
    var o = {};
    process.mixin(o, this.defaults);
    process.mixin(true, o, options);
    return o;
  }
});

function service(constructor, defaults, methods) {
  constructor.prototype = new Service(defaults || {});
  process.mixin(constructor.prototype, methods || {});
  return constructor;
}

process.mixin(exports, {
  Request: Request,
  Service: Service,
  request: request,
  service: service,
  get: get,
  post: post,
  put: put,
  del: del,
  parsers: parsers,
  file: multipart.file,
  data: multipart.data
});
