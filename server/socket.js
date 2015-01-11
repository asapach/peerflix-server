'use strict';

module.exports = function (server) {
  var io = require('socket.io').listen(server),
    _ = require('lodash'),
    progress = require('./progressbar'),
    store = require('./store');

  io.set('log level', 2);

  io.sockets.on('connection', function (socket) {
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

  store.on('torrent', function (infoHash, torrent) {
    function stats() {
      var swarm = torrent.swarm;
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
    }

    function listen() {
      var notifyProgress = _.throttle(function () {
        if (torrent) {
          io.sockets.emit('download', infoHash, progress(torrent.bitfield.buffer));
        }
      }, 1000);

      io.sockets.emit('verifying', infoHash, stats());

      torrent.once('verifying', function () {
        io.sockets.emit('verifying', infoHash, stats());
      });

      torrent.once('ready', function () {
        io.sockets.emit('ready', infoHash, stats());
      });

      torrent.on('uninterested', function () {
        io.sockets.emit('uninterested', infoHash);
      });

      torrent.on('interested', function () {
        io.sockets.emit('interested', infoHash);
      });

      var interval = setInterval(function () {
        io.sockets.emit('stats', infoHash, stats());
      }, 1000);

      torrent.on('verify', notifyProgress);

      torrent.once('destroyed', function () {
        clearInterval(interval);
        io.sockets.emit('destroyed', infoHash);
        torrent = null;
      });
    }

    if (torrent.torrent) {
      listen();
    } else {
      torrent.once('verifying', listen);
    }
  });
};
