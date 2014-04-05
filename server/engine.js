'use strict';
var torrentStream = require('torrent-stream');

module.exports = function (torrent) {
  var engine = torrentStream(torrent);

  function trace() {
    console.log('fetching torrent metadata from: ' + engine.swarm.wires.length + ' peers');
  }

  engine.swarm.on('wire', trace);

  engine.on('ready', function () {
    console.log('ready');
    engine.files.forEach(function (file, i) {
      console.log(i + ' ' + file.name);
    });
    engine.swarm.removeListener('wire', trace);
  });

  engine.on('uninterested', function () {
    console.log('dht: off');
    engine.swarm.pause();
  });

  engine.on('interested', function () {
    console.log('dht: on');
    engine.swarm.resume();
  });

  return engine;
};
