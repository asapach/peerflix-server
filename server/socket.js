'use strict';

var io = require('socket.io').listen(8111),
  _ = require('lodash'),
  progress = require('./progressbar');

io.set('log level', 2);

io.sockets.on('connection', function (socket) {
  var store = require('./store');
  socket.on('pause', function (infoHash) {
    console.log('pausing ' + infoHash);
    var torrent = store.get(infoHash);
    if (torrent && torrent.swarm) {
      torrent.swarm.pause();
    }
  });
  socket.on('resume', function (infoHash) {
    console.log('resuming ' + infoHash);
    var torrent = store.get(infoHash);
    if (torrent && torrent.swarm) {
      torrent.swarm.resume();
    }
  });
  socket.on('select', function (infoHash, file) {
    console.log('selected ' + infoHash + '/' + file);
    var torrent = store.get(infoHash);
    if (torrent && torrent.files) {
      file = torrent.files[file];
      file.select();
      file.selected = true;
    }
  });
  socket.on('deselect', function (infoHash, file) {
    console.log('deselected ' + infoHash + '/' + file);
    var torrent = store.get(infoHash);
    if (torrent && torrent.files) {
      file = torrent.files[file];
      file.deselect();
      file.selected = false;
    }
  });
});

module.exports = {
  register: function (infoHash, engine) {
    engine.once('verifying', function () {
      var notifyProgress = _.throttle(function () {
          io.sockets.emit('download', infoHash, progress(engine.bitfield.buffer));
        }, 1000);

      io.sockets.emit('verifying', infoHash, stats());

      engine.on('ready', function () {
        io.sockets.emit('ready', infoHash, stats());
      });

      engine.on('uninterested', function () {
        io.sockets.emit('uninterested', infoHash);
      });

      engine.on('interested', function () {
        io.sockets.emit('interested', infoHash);
      });

      var interval = setInterval(function () {
        io.sockets.emit('stats', infoHash, stats());
      }, 1000);

      engine.on('download', notifyProgress);
      engine.on('verify', notifyProgress);

      engine.on('destroyed', function () {
        clearInterval(interval);
        io.sockets.emit('destroyed', infoHash);
      });
    });

    var stats = function () {
      var swarm = engine.swarm;
      return {
        peers: {
          total: swarm.wires.length,
          unchocked: swarm.wires.reduce(function (prev, wire) {
            return prev + !wire.peerChoking;
          }, 0)
        },
        traffic: {
          down: swarm.downloaded,
          up: swarm.uploaded
        },
        speed: {
          down: swarm.downloadSpeed(),
          up: swarm.uploadSpeed()
        },
        queue: swarm.queued,
        paused: swarm.paused
      };
    };
  }
};
