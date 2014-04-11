'use strict';

var rangeParser = require('range-parser'),
  mime = require('mime'),
  pump = require('pump'),
  _ = require('lodash'),
  express = require('express'),
  store = require('./store'),
  progress = require('./progressbar'),
  api = express();

api.use(express.json());
api.use(express.logger('dev'));

function serialize(torrent) {
  return _.extend(_.omit(torrent.torrent, 'pieces'), {
    interested: torrent.amInterested,
    progress: progress(torrent.bitfield.buffer)
  });
}

api.get('/torrents', function (req, res) {
  res.send(store.list().map(serialize));
});

api.get('/torrents/:infoHash', function (req, res) {
  var torrent = store.get(req.params.infoHash);
  if (!torrent) {
    res.send(404);
  }
  res.send(serialize(torrent));
});

api.delete('/torrents/:infoHash', function (req, res) {
  var torrent = store.get(req.params.infoHash);
  if (!torrent) {
    res.send(404);
  }
  store.remove(req.params.infoHash);
  res.send(200);
});

api.post('/torrents', function (req, res) {
  var infoHash = store.add(req.body.link);
  res.send({ infoHash: infoHash });
});

api.get('/torrents/:infoHash/files/:file/:path', function (req, res) {
  var torrent = store.get(req.params.infoHash),
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
