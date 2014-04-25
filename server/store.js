'use strict';

var fs = require('fs'),
  path = require('path'),
  mkdirp = require('mkdirp'),
  Promise = require('promise'),
  read = Promise.denodeify(fs.readFile),
  readTorrent = require('read-torrent'),
  engine = require('./engine'),
  socket = require('./socket'),
  homePath = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'],
  configPath = path.join(homePath, '.config', 'peerflix-server'),
  configFile = path.join(configPath, 'config.json'),
  storageFile = path.join(configPath, 'torrents.json'),
  torrents = {},
  options = {};

function save() {
  mkdirp(configPath, function (err) {
    if (err) { throw err; }
    var state = Object.keys(torrents).map(function (infoHash) {
      return infoHash;
    });
    fs.writeFile(storageFile, JSON.stringify(state), function (err) {
      if (err) { throw err; }
      console.log('current state saved');
    });
  });
}

var store = {
  add: function (link, callback) {
    readTorrent(link, function (err, torrent) {
      if (err) {
        return callback(err);
      }
      var infoHash = torrent.infoHash;
      if (torrents[infoHash]) {
        return infoHash;
      }

      console.log('adding ' + infoHash);

      var e = engine(torrent, options);
      socket.register(infoHash, e);
      torrents[infoHash] = e;
      save();
      callback(null, infoHash);
    });
  },
  get: function (infoHash) {
    return torrents[infoHash];
  },
  remove: function (infoHash) {
    var torrent = torrents[infoHash];
    torrent.destroy();
    torrent.remove(function () {
      torrent.emit('destroyed');
    });
    delete torrents[infoHash];
    save();
  },
  list: function () {
    return Object.keys(torrents).map(function (infoHash) {
      return torrents[infoHash];
    });
  }
};

read(configFile).then(function (config) {
  options = JSON.parse(config);
  console.log('options: ' + JSON.stringify(options));
}, function (err) {
  if (err.code === 'ENOENT') {
    return Promise.resolve();
  }
}).then(function () {
  read(storageFile).then(function (state) {
    var torrents = JSON.parse(state);
    console.log('resuming from previous state');
    torrents.forEach(function (infoHash) {
      store.add({ infoHash: infoHash });
    });
  }, function (err) {
    if (err.code === 'ENOENT') {
      console.log('previous state not found');
    } else {
      throw err;
    }
  });
});

function shutdown(signal) {
  console.log(signal);
  var keys = Object.keys(torrents);
  if (keys.length) {
    var key = keys[0], torrent = torrents[key];
    torrent.destroy(function () {
      torrent.emit('destroyed');
      delete torrents[key];
      process.nextTick(shutdown);
    });
  } else {
    process.nextTick(process.exit);
  }
}

process.on('SIGTERM', function () {
  shutdown('SIGTERM');
});

process.on('SIGINT', function () {
  shutdown('SIGINT');
});

module.exports = store;
