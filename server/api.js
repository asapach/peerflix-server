'use strict';
var rangeParser = require('range-parser'),
    mime = require('mime'),
    pump = require('pump'),
    express = require('express'),
    engine = require('./engine'),
    api = express();

api.get('/torrents', function (req, res) {
  res.send(engine.files);
});

api.get('/torrents/:file', function (req, res) {
  var i = Number(req.params.file);

  if (isNaN(i) || i >= engine.files.length) {
    res.statusCode = 404;
    res.end();
    return;
  }

  var file = engine.files[i];
  var range = req.headers.range;
  range = range && rangeParser(file.length, range)[0];
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mime.lookup(file.name));

  if (!range) {
    res.setHeader('Content-Length', file.length);
    if (req.method === 'HEAD') {
      return res.end();
    }
    pump(file.createReadStream(), res);
    return;
  }

  res.statusCode = 206;
  res.setHeader('Content-Length', range.end - range.start + 1);
  res.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);

  if (req.method === 'HEAD') {
    return res.end();
  }
  pump(file.createReadStream(range), res);
});

module.exports = api;
