const http = require('./httpsvr');

/**
 * http://localhost:8080/api/login => req.$path => {action: 'login'}
 * http://localhost:8080/api/query => req.$path => {action: 'query'}
 * 
 * http://localhost:8080/api/query?id=123&page=2
 * req.$ => {id: '123', page: '2'} instanceof URLSearchParams
 * req.$path => {action: 'query'}
 */
http.route('/api/{action}', (req, rsp) => {
  let qs = {};
  Array.from(req.$.keys()).forEach((key) => qs[key] = req.$.get(key));
  rsp.writeHead(200, {'Content-Type': 'application/json'});
  rsp.end(JSON.stringify({
    'req.$': qs,
    'req.$path': req.$path
  }, null, 2));
});

/**
 * http://localhost:8080/api/upload
 * GET /api/upload => 405 Method Not Allowed
 */
http.route('/api/upload', 'POST', (req, rsp) => {
  // req.data => Buffer
  rsp.end();
});

/**
 * http://localhost:8080/admin/profile => req.$ => {user: 'admin'}
 * http://localhost:8080/alice/profile => req.$ => {user: 'alice'}
 */
http.route('/{user}/profile', ['GET', 'POST'], (req, rsp) => {
  req.on('data', (chunk) => {}).on('end', () => {}); //if set nodata
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
  accessLog: ''
}).listen(8080);
