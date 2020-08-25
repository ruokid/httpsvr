'use strict';
const fs = require('fs');
const http = require('http');
const Path = require('path');
const URL = require('url');

/**
 * routing information base
 * 1.以请求路径为键名保存handler和允许的methods
 * 2.按路径.split('/')之后储存handler和允许的methods
 */
const RIB = {'': {}};

/**
 * 路由处理
 * @param path {String} 请求地址路径部分，不包括协议、域名和查询参数
 * @param methods {String|String[]} 允许的请求方法，默认接受所有(http.METHODS)，需要大写字母
 * @param handler {Function} 请求处理函数(IncomingMessage, ServerResponse)
 * @param options {*} 可选项
 */
exports.route = function(path, methods, handler, options={}) {
  switch (typeof methods) {
    case 'function':
      handler = methods;
      methods = http.METHODS;
      break;
    case 'string':
      methods = methods.length > 0 ? [ methods ] : http.METHODS;
      break;
    case 'object':
      if (Array.isArray(methods)) {
        break;
      }
    default:
      methods = http.METHODS;
      return;
  }

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // 分隔path，然后按键储存
  let rib = RIB;
  path.split('/').forEach((v) => {
    if (v.length > 0) {
      let base = {};
      if (v.startsWith('{') && v.endsWith('}')) {
        base = {'*': {}};
        v = '';
      }
      rib[v] = Object.assign(base, rib[v]);
      rib = v === '' ? rib[v]['*'] : rib[v];
    }
  });

  rib[''] = Object.assign(options, {
    path: path,
    methods: methods,
    handler: handler
  });
}

/**
 * node内置的http模块，方便外部使用
 */
exports.module = http;

/**
 * 创建HTTP服务
 * @param {*} options 可选配置
 * @returns {http.Server} 和内置http.createServer一样
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
    let filename = Path.join(wwwroot, decodeURIComponent(pathname), pathname.endsWith('/') ? 'index.html' : '');
    let fextname = Path.extname(filename);

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
          response.statusCode,
          request.method,
          request.url
        ].join(' ')
      );
    });

    request.$ = qs; //附加上解析好的查询参数对象(QueryString)
    response.setHeader('Content-Type', 'text/plain'); //默认返回文本内容
    response.setHeader('Server', server); //自定义服务器名称

    let pns = [];
    let rib = RIB;
    let foundFile = fs.existsSync(filename);
    let foundPath = pathname.split('/').filter((v) => v.length > 0).every((v, i, arr) => {
      v = decodeURIComponent(v);
      if (rib.hasOwnProperty(v)) { //存在已保存路径
        rib = rib[v];
        return true;
      }

      let wildcard = rib['']['*'];
      if (wildcard) { //存在路径参数
        pns.push(v); //保存参数
        // 如果这个文件存在并且路径参数在最后一位，那么等下就直接进入文件服务
        if (!foundFile || i + 1 < arr.length) {
          rib = wildcard;
          return true;
        }
      }
    }); //路径完全匹配（包含参数）
    rib = rib[''];
    if (foundPath && rib && rib.handler) {
      if (rib.methods.includes(request.method)) {
        rib.path.split('/')
          .filter((v) => v.length > 0 && v.startsWith('{') && v.endsWith('}'))
          .forEach((v, i) => {
            request['$' + v.substring(1, v.length - 1)] = pns[i]; //路径参数
          });

        try {
          if (rib.nodata) {
            rib.handler(request, response); //自行接收数据
          }
          else {
            request.data = Buffer.from([]);
            request.on('data', (chunk) => {
              request.data = Buffer.concat([request.data, chunk], request.data.length + chunk.length);
            }).on('end', () => {
              rib.handler(request, response); //数据接收完毕
            });
          }
        }
        catch {
          if (!response.finished) {
            response.writeHead(500);
            response.end();
          }
        }
      }
      else {
        response.writeHead(405, {
          Allow: rib.methods.join(',')
        });
        response.end();
      }
    }
    else if (foundFile) {
      fextname = fextname[0] === '.' ? fextname.substr(1) : fextname;
      response.setHeader('Content-Type', mime[fextname] || 'text/plain');
      fs.stat(filename, (err, stats) => {
        if (!err && stats.isFile()) {
          response.setHeader('Content-Length', stats.size);
          fs.createReadStream(filename).pipe(response);
        }
        else {
          response.writeHead(404);
          response.end();
        }
      });
    }
    else {
      response.writeHead(404);
      response.end();
    }
  });
};
