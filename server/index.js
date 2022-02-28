'use strict';

var rangeParser = require('range-parser'),
  pump = require('pump'),
  _ = require('lodash'),
  express = require('express'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  multipart = require('connect-multiparty'),
  fs = require('fs'),
  archiver = require('archiver'),
  store = require('./store'),
  progress = require('./progressbar'),
  stats = require('./stats'),
  request = require('request'),
  htmlparser = require('htmlparser'),
  select = require('soupselect').select,
  magnetRegex = new RegExp(/href="(magnet:\?xt=urn:btih:[^"]*)"/),
  api = express();

api.use(bodyParser.json())
api.use(logger('dev'));
api.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

function serialize(torrent) {
  if (!torrent.torrent) {
    return { infoHash: torrent.infoHash };
  }
  var pieceLength = torrent.torrent.pieceLength;

  return {
    infoHash: torrent.infoHash,
    name: torrent.torrent.name,
    length: torrent.torrent.length,
    interested: torrent.amInterested,
    ready: torrent.ready,
    files: torrent.files.map(function (f) {
      // jshint -W016
      var start = f.offset / pieceLength | 0;
      var end = (f.offset + f.length - 1) / pieceLength | 0;

      return {
        name: f.name,
        path: f.path,
        link: '/torrents/' + torrent.infoHash + '/files/' + encodeURIComponent(f.path),
        length: f.length,
        offset: f.offset,
        selected: torrent.selection.some(function (s) {
          return s.from <= start && s.to >= end;
        })
      };
    }),
    progress: progress(torrent.bitfield.buffer)
  };
}

function findTorrent(req, res, next) {
  var torrent = req.torrent = store.get(req.params.infoHash);
  if (!torrent) {
    return res.sendStatus(404);
  }
  next();
}

api.get('/torrents', function (req, res) {
  res.send(store.list().map(serialize));
});

api.post('/torrents', function (req, res) {
  store.add(req.body.link, function (err, infoHash) {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    } else {
      res.send({ infoHash: infoHash });
    }
  });
});

api.post('/upload', multipart(), function (req, res) {
  var file = req.files && req.files.file;
  if (!file) {
    return res.status(500).send('file is missing');
  }
  store.add(file.path, function (err, infoHash) {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    } else {
      res.send({ infoHash: infoHash });
    }
    fs.unlink(file.path, function (err) {
      if (err) {
        console.error(err);
      }
    });
  });
});

api.get('/torrents/:infoHash', findTorrent, function (req, res) {
  res.send(serialize(req.torrent));
});

api.post('/torrents/:infoHash/start/:index?', findTorrent, function (req, res) {
  var index = parseInt(req.params.index);
  if (index >= 0 && index < req.torrent.files.length) {
    req.torrent.files[index].select();
    store.save();
  } else {
    req.torrent.files.forEach(function (f) {
      f.select();
    });
    store.save();
  }
  res.sendStatus(200);
});

api.post('/torrents/:infoHash/stop/:index?', findTorrent, function (req, res) {
  var index = parseInt(req.params.index);
  if (index >= 0 && index < req.torrent.files.length) {
    req.torrent.files[index].deselect();
    store.save();
  } else {
    req.torrent.files.forEach(function (f) {
      f.deselect();
    });
    store.save();
  }
  res.sendStatus(200);
});

api.post('/torrents/:infoHash/pause', findTorrent, function (req, res) {
  req.torrent.swarm.pause();
  res.sendStatus(200);
});

api.post('/torrents/:infoHash/resume', findTorrent, function (req, res) {
  req.torrent.swarm.resume();
  res.sendStatus(200);
});

api.delete('/torrents/:infoHash', findTorrent, function (req, res) {
  store.remove(req.torrent.infoHash);
  res.sendStatus(200);
});

api.get('/torrents/:infoHash/stats', findTorrent, function (req, res) {
  res.send(stats(req.torrent));
});

api.get('/torrents/:infoHash/files', findTorrent, function (req, res) {
  var torrent = req.torrent;
  var proto = req.get('x-forwarded-proto') || req.protocol;
  var host = req.get('x-forwarded-host') || req.get('host');
  res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
  res.attachment(torrent.torrent.name + '.m3u');
  res.send('#EXTM3U\n' + torrent.files.map(function (f) {
      return '#EXTINF:-1,' + f.path + '\n' +
        proto + '://' + host + '/torrents/' + torrent.infoHash + '/files/' + encodeURIComponent(f.path);
    }).join('\n'));
});

api.all('/torrents/:infoHash/files/:path([^"]+)', findTorrent, function (req, res) {
  var torrent = req.torrent, file = _.find(torrent.files, { path: req.params.path });

  if (!file) {
    return res.sendStatus(404);
  }

  if (typeof req.query.ffmpeg !== 'undefined') {
    return require('./ffmpeg')(req, res, torrent, file);
  }

  var range = req.headers.range;
  range = range && rangeParser(file.length, range)[0];
  res.setHeader('Accept-Ranges', 'bytes');
  res.type(file.name);
  req.connection.setTimeout(3600000);

  if (!range) {
    res.setHeader('Content-Length', file.length);
    res.setHeader('Content-Type', 'application/octet-stream');
    if (req.method === 'HEAD') {
      return res.end();
    }
    return pump(file.createReadStream(), res);
  }

  res.statusCode = 206;
  res.setHeader('Content-Length', range.end - range.start + 1);
  res.setHeader('Content-Range', 'bytes ' + range.start + '-' + range.end + '/' + file.length);

  if (req.method === 'HEAD') {
    return res.end();
  }
  pump(file.createReadStream(range), res);
});

api.get('/torrents/:infoHash/archive', findTorrent, function (req, res) {
  var torrent = req.torrent;

  res.attachment(torrent.torrent.name + '.zip');
  req.connection.setTimeout(3600000);

  var archive = archiver('zip');
  archive.on('warning', function (err) {
    console.error(err);
  });
  archive.on('error', function (err) {
    throw err;
  });

  pump(archive, res);

  torrent.files.forEach(function (f) {
    archive.append(f.createReadStream(), { name: f.path });
  });
  archive.finalize();
});

function parseDom(body) {
  var parseHandler = new htmlparser.DefaultHandler(function (err, dom) {
    if (err) {
      console.error("Error: " + err);
    }
  });
  var parser = new htmlparser.Parser(parseHandler);
  parser.parseComplete(body);
  return parseHandler.dom;
}

api.get('/search/:param', function (req, res) {
  request(`https://1337x.to/search/${encodeURIComponent(req.params.param)}/1/`, function(error, response, body) {
    var dom = parseDom(body);
    var rows = select(dom, '.search-page table tbody tr');
    var results = [];
    rows.forEach(function(row) {
      results.push({
        name: select(row, ".name a")[1].children[0].raw,
        seeds: select(row, ".seeds")[0].children[0].raw,
        leeches: select(row, ".leeches")[0].children[0].raw,
        size: select(row, ".size")[0].children[0].raw,
        link: `https://1337x.to${select(row, ".name a")[1].attribs.href}`,
      });
    });
    res.send(results);
  });
});

api.post('/search', function (req, res) {
  console.log(req.body.param);
  request(req.body.param, function(error, response, body) {
    var link = body.match(magnetRegex)[1];
    store.add(link, function (err, infoHash) {
      if (err) {
        console.error(err);
        res.status(500).send(err);
      } else {
        res.send({ infoHash: infoHash });
      }
    });
  });
});

module.exports = api;
