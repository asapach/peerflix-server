'use strict';
var torrentStream = require('torrent-stream');

module.exports = function (torrent) {
  var engine = torrentStream(torrent);

  engine.on('ready', function () {
    console.log('ready');
    engine.files.forEach(function (file, i) {
      console.log(i + ' ' + file.name);
    });
  });

  engine.on('uninterested', function () {
    console.log('uninterested');
    //engine.swarm.pause();
  });

  engine.on('interested', function () {
    console.log('interested');
    //engine.swarm.resume();
  });

  process.on('exit', function () {
    console.log('shutting down');
    engine.destroy();
  });

  return engine;
};
