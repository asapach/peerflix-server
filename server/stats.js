'use strict';

module.exports = function stats(torrent) {
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
};
