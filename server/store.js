'use strict';

var fs = require('fs'),
  path = require('path'),
  engine = require('./engine'),
  socket = require('./socket'),
  filePath = path.join(__dirname, 'config', 'torrents.json'),
  torrents = {};

function writeFile() {
  var state = Object.keys(torrents).map(function (infoHash) {
    return infoHash;
  });
  fs.writeFile(filePath, JSON.stringify(state), function (err) {
    if (err) {
      throw err;
    }
    console.log('current state saved');
  });
}

function save() {
  var dir = path.dirname(filePath);
  fs.exists(dir, function (exists) {
    if (exists) {
      writeFile();
    } else {
      fs.mkdir(dir, function (err) {
        if (err) {
          throw err;
        }
        writeFile();
      });
    }
  });
}

var store = {
  add: function (link) {
    var torrent = engine(link),
      infoHash = torrent.swarm.infoHash.toString('hex');
    socket.register(torrent);
    torrent.once('ready', function () {
      torrents[infoHash] = torrent;
      save();
      return infoHash;
    });
  },
  get: function (infoHash) {
    if (infoHash) {
      return torrents[infoHash];
    }
    return torrents;
  },
  list: function () {
    return Object.keys(torrents).map(function (infoHash) {
      return torrents[infoHash];
    });
  }
};

fs.readFile(filePath, function (err, state) {
  if (err) {
    if (err.code === 'ENOENT') {
      console.log('previous state not found');
    } else {
      throw err;
    }
  } else {
    var torrents = JSON.parse(state);
    console.log('resuming from previous state');
    torrents.forEach(function (infoHash) {
      store.add({ infoHash: infoHash });
    });
  }
});

module.exports = store;
