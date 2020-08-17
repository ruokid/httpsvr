const http = require('httpsvr');

http.route('/', (req, rsp) => {
  rsp.writeHead(200, {'Content-Type': 'text/html'});
  rsp.write('<html>');
  rsp.write('<head><title>Welcome</title></head>');
  rsp.write('<body>');
  rsp.write('<a href="/api/query?id=1&page=1">hello world</a>');
  rsp.write('</body>');
  rsp.write('</html>');
  rsp.end();
});

http.route('/api/query', (req, rsp) => {
  rsp.writeHead(200, {'Content-Type': 'application/json'});
  let qs = {};
  Array.from(req.qs.keys()).forEach((key) => qs[key] = req.qs.get(key));
  rsp.write(JSON.stringify(qs));
  rsp.end();
});

http.createServer({
  accessLog: ''
}).listen(8080); //http://localhost:8080/
