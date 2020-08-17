'use strict';
const fs = require('fs');
const http = require('http');
const Path = require('path');
const URL = require('url');

/**
 * routing information base
 * 
 * 以请求路径为键名保存handler和允许的methods
 */
const RIB = {};

/**
 * 路由处理
 * @param path {String} 请求地址路径部分，不包括协议、域名和查询参数
 * @param methods {String|String[]} 允许的请求方法，默认接受所有(http.METHODS)
 * @param handler {Function} 处理函数，参数(IncomingMessage, ServerResponse)
 * @example
 *  const http = require('httpsvr');
 *  http.route('/api/query', (req, rsp) => {
 *    // 注意：异常需要自行捕获，不然服务就挂了
 *    console.log(req.qs); //=> URLSearchParams
 *    req.on('data', (chunk) => {}).on('end', () => {});
 *    rsp.end(); //default 200 OK
 *  });
 */
function route(path, methods, handler) {
  switch (typeof methods) {
    case 'function':
      handler = methods;
      methods = [];
      break;
    case 'string':
      methods = methods.length > 0 ? [methods] : [];
      break;
    case 'object':
      if (Array.isArray(methods)) {
        break;
      }
    default:
      return;
  }

  RIB[path] = {
    methods: methods.map((m) => m.toUpperCase()),
    handler: handler
  }
}
exports.route = route;

/**
 * node内置的http模块，方便外部使用
 */
exports.module = http;

/**
 * 创建HTTP服务
 * @param {*} options 可选配置
 * @returns {http.Server} 和内置http.createServer一样
 * @example
 *  const http = require('httpsvr');
 *  http.createServer().listen(8080); //http://localhost:8080
 *  http.createServer({
 *    accessLog: '', //指定一个文件名用来写入访问日志，空字符=stdout
 *    server: 'Node.js',
 *    wwwroot: '/home/xxx/www'
 *  }).listen(8081); //http://localhost:8081
 */
exports.createServer = function(options={}) {
  let wwwroot = options.wwwroot || __dirname;
  let mime = options.mime || {
    css:  'text/css',
    gif:  'image/gif',
    html: 'text/html',
    htm:  'text/html',
    ico:  'image/vnd.microsoft.icon',
    jpeg: 'image/jpeg',
    jpg:  'image/jpeg',
    json: 'application/json',
    js:   'application/javascript',
    log:  'text/plain',
    png:  'image/png',
    svg:  'image/svg+xml',
    txt:  'text/plain',
    webp: 'image/webp',
    xml:  'application/xml'
  };
  let server = options.server || 'Node.js';

  let accessLog = function() {};
  if (typeof options.accessLog === 'string') {
    let dir = Path.dirname(options.accessLog);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    accessLog = options.accessLog.length > 0
      ? function(data) {
        fs.appendFile(options.accessLog, data + '\n', () => {});
      }
      : console.log;
  }

  return http.createServer((request, response) => {
    let dtn = new Date();
    let url = URL.parse(request.url);
    let qs = new URL.URLSearchParams(url.search);
    let pathname = url.pathname;
    let ri = RIB[pathname];
    let filename = Path.join(wwwroot, pathname, pathname.endsWith('/') ? 'index.html' : '');
    let fextname = Path.extname(filename);

    request.qs = qs; //附加上解析好的查询参数对象(QueryString)
    request.on('error', (err) => {
      response.writeHead(400);
      response.end();
      console.error(err);
    });

    response.on('error', (err) => {
      response.writeHead(500);
      response.end();
      console.error(err);
    }).on('finish', () => {
      dtn.setHours(dtn.getHours() - dtn.getTimezoneOffset() / 60);
      accessLog(
        [
          '[' + dtn.toISOString().substr(0, 23) + ']' + request.connection.remoteAddress,
          '-',
          request.method,
          request.url,
          response.statusCode
        ].join(' ')
      );
    });

    response.setHeader('Content-Type', 'text/plain'); //默认返回文本内容
    response.setHeader('Server', server); //自定义服务器名称

    if (ri) {
      if (ri.methods.length === 0 || ri.methods.indexOf(request.method) >= 0) {
        ri.handler(request, response); //执行handler
      }
      else {
        response.writeHead(405, {
          Allow: ri.methods.join(',')
        });
        response.end();
      }
    }
    else if (fs.existsSync(filename)) {
      fextname = fextname[0] === '.' ? fextname.substr(1) : fextname;
      response.setHeader('Content-Type', mime[fextname] || 'text/plain');
      response.setHeader('Content-Length', fs.statSync(filename).size);
      fs.createReadStream(filename).pipe(response);
    }
    else {
      response.writeHead(404);
      response.end();
    }
  })
};
