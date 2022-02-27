'use strict';

var fs = require('fs'),
  path = require('path'),
  events = require('events'),
  _ = require('lodash'),
  mkdirp = require('mkdirp'),
  readTorrent = require('read-torrent'),
  engine = require('./engine'),
  homePath = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'],
  configPath = process.env['PEERFLIX_CONFIG_PATH'] ? process.env['PEERFLIX_CONFIG_PATH'] : path.join(homePath, '.config', 'peerflix-server'),
  configFile = path.join(configPath, 'config.json'),
  storageFile = path.join(configPath, 'torrents.json'),
  torrents = {},
  options = {};

function save() {
  mkdirp(configPath, function (err) {
    if (err) {
      throw err;
    }
    var state = {};
    var infoHashes = Object.keys(torrents);
    infoHashes.forEach(function (infoHash) {
      var torrent = torrents[infoHash]
      var selection = [];
      if (torrent.torrent) {
        var pieceLength = torrent.torrent.pieceLength;
        selection = torrent.files.map(function (f) {
          // jshint -W016
          var start = f.offset / pieceLength | 0;
          var end = (f.offset + f.length - 1) / pieceLength | 0;
          return torrent.selection.some(function (s) {
            return s.from <= start && s.to >= end;
          });
        });
      }
      state[infoHash] = selection;
    });
    fs.writeFile(storageFile, JSON.stringify(state), function (err) {
      if (err) {
        throw err;
      }
      console.log('current state saved');
    });
  });
}

var store = _.extend(new events.EventEmitter(), {
  add: function (link, callback) {
    if (/^(\w{32}|\w{40})$/.test(link)) {
      link = `magnet:?xt=urn:btih:${link}`;
    }

    readTorrent(link, function (err, torrent) {
      if (err) {
        return callback(err);
      }
      var infoHash = torrent.infoHash;
      if (torrents[infoHash]) {
        return callback(null, infoHash);
      }

      console.log('adding ' + infoHash);

      try {
        var e = engine(torrent, options);
        store.emit('torrent', infoHash, e);
        torrents[infoHash] = e;
        torrents[infoHash].once('ready', function () {
          // select the largest file
          var file = torrents[infoHash].files.reduce(function (a, b) {
            return a.length > b.length ? a : b;
          });
          file.select();
          store.save();
        });
        save();
        callback(null, infoHash);
      } catch (e) {
        callback(e);
      }
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
  },
  load: function (infoHash) {
    console.log('loading ' + infoHash);
    var e = engine({ infoHash: infoHash }, options);
    store.emit('torrent', infoHash, e);
    torrents[infoHash] = e;
  },
  save: function () {
    save();
  }
});

mkdirp(configPath, function (err) {
  if (err) {
    throw err;
  }
  fs.readFile(configFile, function (err, data) {
    if (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    } else {
      options = JSON.parse(data);
      console.log('options: ' + JSON.stringify(options));
    }

    fs.readFile(storageFile, function (err, data) {
      if (err) {
        if (err.code === 'ENOENT') {
          console.log('previous state not found');
        } else {
          throw err;
        }
      } else {
        var state = JSON.parse(data);
        console.log('resuming from previous state');
        if (Array.isArray(state)) {
          // Backwards state compatibility (load infohashes and select biggest file)
          state.forEach(function (infoHash) {
            store.load(infoHash);
            torrents[infoHash].once('ready', function () {
              // select the largest file
              var file = torrents[infoHash].files.reduce(function (a, b) {
                return a.length > b.length ? a : b;
              });
              file.select();
              store.save();
            })
          })
        } else {
          // New state setup (load infohashes and remember selected files)
          var infoHashes = Object.keys(state);
          infoHashes.forEach(function (infoHash) {
            store.load(infoHash);
            torrents[infoHash].once('ready', function () {
              var selection = state[infoHash];
              for (let file = 0; file < selection.length; file++) {
                var selected = selection[file];
                if (selected) {
                  torrents[infoHash].files[file].select();
                }
              }
            })
          })
        }
      }
    });
  });
});

function shutdown(signal) {
  if (signal) {
    console.log(signal);
  }

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
