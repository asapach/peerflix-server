'use strict';
var fs = require('fs'),
    rangeParser = require('range-parser'),
    url = require('url'),
    mime = require('mime'),
    pump = require('pump'),
    engine = require('./engine');

function middleware(request, response) {
  var u = url.parse(request.url);

  if (u.pathname === '/favicon.ico') return response.end();
//  if (u.pathname === '/') u.pathname = '/'+index;

  var i = Number(u.pathname.slice(1));

  if (isNaN(i) || i >= engine.files.length) {
    response.statusCode = 404;
    response.end();
    return;
  }

  var file = engine.files[i];
  var range = request.headers.range;
  range = range && rangeParser(file.length, range)[0];
  response.setHeader('Accept-Ranges', 'bytes');
  response.setHeader('Content-Type', mime.lookup(file.name));

  if (!range) {
    response.setHeader('Content-Length', file.length);
    if (request.method === 'HEAD') return response.end();
    pump(file.createReadStream(), response);
    return;
  }

  response.statusCode = 206;
  response.setHeader('Content-Length', range.end - range.start + 1);
  response.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);

  if (request.method === 'HEAD') return response.end();
  pump(file.createReadStream(range), response);
}

module.exports = function (connect, options, middlewares) {
  middlewares.push(middleware);
  return middlewares;
};