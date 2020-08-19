const http = require('./httpsvr');

http.route('/', (req, rsp) => {
  rsp.writeHead(200, {'Content-Type': 'text/html'});
  rsp.write('<html>');
  rsp.write('<head><title>Welcome</title></head>');
  rsp.write('<body>');
  rsp.write('<div>');
  rsp.write('<a href="/api/hello">/api/{action}</a>');
  rsp.write('<input id="action" onchange="javascript:document.links[0].href=\'/api/\'+this.value" value="hello">');
  rsp.write('</div>');
  rsp.write('<div><a href="/api/query?id=1&page=1">/api/query</div>');
  rsp.write('</body></html>');
  rsp.end();
});

http.route('/api/{action}', (req, rsp) => {
  rsp.writeHead(200, {'Content-Type': 'application/json'});
  rsp.end(JSON.stringify(req.$));
});

http.route('/api/query', (req, rsp) => {
  rsp.writeHead(200, {'Content-Type': 'application/json'});
  let qs = {};
  Array.from(req.qs.keys()).forEach((key) => qs[key] = req.qs.get(key));
  rsp.end(JSON.stringify(qs));
});

http.createServer({
  accessLog: ''
}).listen(8080); //http://localhost:8080/
