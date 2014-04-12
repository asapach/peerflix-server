'use strict';

var fs = require('fs'),
  path = require('path'),
  Promise = require('promise'),
  read = Promise.denodeify(fs.readFile),
  engine = require('./engine'),
  socket = require('./socket'),
  configPath = path.join(__dirname, 'config'),
  configFile = path.join(configPath, 'config.json'),
  storageFile = path.join(configPath, 'torrents.json'),
  torrents = {},
  options = {};

function writeFile() {
  var state = Object.keys(torrents).map(function (infoHash) {
    return infoHash;
  });
  fs.writeFile(storageFile, JSON.stringify(state), function (err) {
    if (err) {
      throw err;
    }
    console.log('current state saved');
  });
}

function save() {
  fs.exists(configPath, function (exists) {
    if (exists) {
      writeFile();
    } else {
      fs.mkdir(configPath, function (err) {
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
    var torrent = engine(link, options),
      infoHash = torrent.swarm.infoHash.toString('hex');
    socket.register(torrent);
    torrents[infoHash] = torrent;
    save();
    return infoHash;
  },
  get: function (infoHash) {
    if (infoHash) {
      return torrents[infoHash];
    }
    return torrents;
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
