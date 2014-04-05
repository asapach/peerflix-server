'use strict';

var rangeParser = require('range-parser'),
  mime = require('mime'),
  pump = require('pump'),
  magnet = require('magnet-uri'),
  _ = require('lodash'),
  express = require('express'),
  engine = require('./engine'),
  socket = require('./socket'),
  torrents = {},
  api = express();

api.use(express.json());

api.get('/torrents', function (req, res) {
  res.send(Object.keys(torrents).map(function (infoHash) {
    return _.omit(torrents[infoHash].torrent, 'pieces');
  }));
});

api.get('/torrents/:infoHash', function (req, res) {
  var torrent = torrents[req.params.infoHash];
  if (!torrent) {
    res.send(404);
  }
  res.send(_.omit(torrent.torrent, 'pieces'));
});

api.post('/torrents', function (req, res) {
  var link = magnet(req.body.link),
    infoHash = link.infoHash,
    torrent = engine(req.body.link);
  torrents[infoHash] = torrent;
  socket.register(torrent);
  res.send({ infoHash: infoHash });
});

api.get('/torrents/:infoHash/files/:file', function (req, res) {
  var torrent = torrents[req.params.infoHash],
    i = Number(req.params.file);

  if (!torrent || isNaN(i) || i >= torrent.files.length) {
    res.send(404);
    return;
  }

  var file = torrent.files[i];
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
