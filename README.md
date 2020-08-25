Intro
-----
简单，无依赖的http服务器

Simple, no-dependence http server.

Installation
------------
npm快速安装

Easiest way is npm.
```
  npm install httpsvr
```

Usage
-----
```javascript
const http = require('httpsvr');

/**
 * http://localhost:8080/api/login => req.$action => 'query'
 * http://localhost:8080/api/query => req.$action => 'query'
 * 
 * http://localhost:8080/api/query?id=123&page=2
 * req.$ => {id: '123', page: '2'} instanceof URLSearchParams
 * req.$action => 'query'
 */
http.route('/api/{action}', (req, rsp) => {
  let qs = {};
  Array.from(req.$.keys()).forEach((key) => qs[key] = req.$.get(key));
  rsp.writeHead(200, {'Content-Type': 'application/json'});
  rsp.end(JSON.stringify({
    'req.$': qs,
    'req.$action': req.$action
  }, null, 2));
});

/**
 * http://localhost:8080/api/upload
 * GET /api/upload => 405 Method Not Allowed
 */
http.route('/api/upload', 'POST', (req, rsp) => {
  let formString = req.data.toString('utf8'); //req.data => Buffer
  rsp.setHeader('Content-Type', 'text/plain; charset=utf-8');
  rsp.end(decodeURIComponent(formString));
});

/**
 * http://localhost:8080/admin/info/login
 * req.$user => 'admin'
 * req.$action => 'login'
 * 
 * http://localhost:8080/alice/info/logout
 * req.$user => 'alice'
 * req.$action => 'logout'
 */
http.route('/{user}/info/{action}', ['GET', 'POST'], (req, rsp) => {
  req.on('data', (chunk) => {}).on('end', () => {}); //if set nodata = true
  rsp.end(); //default 200 OK
}, {nodata: true});

/**
 * Started HTTP server on port 8080
 * http://localhost:8080
 * wwwroot => __dirname
 */
http.createServer({
  // server: 'httpsvr/1.1.1',
  // wwwroot: '/root/www',
  accessLog: '' //stdout
}).listen(8080);
```
