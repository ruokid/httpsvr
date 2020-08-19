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
 * http://localhost:8080/api/login => req.$ => {action: 'login'}
 * http://localhost:8080/api/query => req.$ => {action: 'query'}
 * 
 * http://localhost:8080/api/query?id=123&page=2
 * req.$ => {action: 'query'}
 * req.qs => {id: '123', page: '2'}
 * 
 * req.qs instanceof URLSearchParams
 */
http.route('/api/{action}', (req, rsp) => {
  let qs = {};
  Array.from(req.qs.keys()).forEach((key) => qs[key] = req.qs.get(key));
  rsp.writeHead(200, {'Content-Type': 'application/json'});
  rsp.end(JSON.stringify({
    'req.$': req.$,
    'req.qs': qs
  }, null, 2));
});

/**
 * http://localhost:8080/api/upload
 * GET /api/upload => 405 Method Not Allowed
 */
http.route('/api/upload', 'POST', (req, rsp) => {
  req.on('data', (chunk) => {}).on('end', () => {});
  rsp.end();
});

/**
 * http://localhost:8080/admin/profile => req.$ => {user: 'admin'}
 * http://localhost:8080/alice/profile => req.$ => {user: 'alice'}
 */
http.route('/{user}/profile', ['GET', 'POST'], (req, rsp) => {
  rsp.end(); //default 200 OK
});

/**
 * Started HTTP server on port 8080
 * http://localhost:8080
 * wwwroot => __dirname
 */
http.createServer().listen(8080);
```
