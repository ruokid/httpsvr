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

http.route('/api/{action}', (req, rsp) => {
  rsp.writeHead(200, {'Content-Type': 'application/json'});
  rsp.end(JSON.stringify(req.$));
});

http.route('/api/query', (req, rsp) => {
  // 注意：异常需要自行捕获，不然服务就挂了
  console.log(req.qs); //=> URLSearchParams
  req.on('data', (chunk) => {}).on('end', () => {});
  rsp.end(); //default 200 OK
});

http.createServer().listen(8080); //http://localhost:8080

// http.createServer({
//   accessLog: '', //指定一个文件名用来写入访问日志，空字符=stdout
//   server: 'httpsvr/1.0.0',
//   wwwroot: '/home/xxx/www'
// }).listen(8081); //http://localhost:8081
```
