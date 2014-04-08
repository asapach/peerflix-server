'use strict';
var torrentStream = require('torrent-stream');

module.exports = function (torrent) {
  var engine = torrentStream(torrent),
    infoHash = engine.swarm.infoHash.toString('hex');

  engine.on('ready', function () {
    console.log(infoHash + ' ready');
    engine.files.forEach(function (file, i) {
      console.log(i + ' ' + file.name);
    });
  });

  engine.on('uninterested', function () {
    console.log('uninterested ' + infoHash);
    //engine.swarm.pause();
  });

  engine.on('interested', function () {
    console.log('interested ' + infoHash);
    //engine.swarm.resume();
  });

  engine.on('error', function (e) {
    console.log('error ' + infoHash + ': ' + e);
  });

  engine.on('destroyed', function () {
    console.log('destroyed ' + infoHash);
    engine.removeAllListeners();
  });

  process.on('exit', function () {
    console.log('shutting down');
    engine.destroy();
  });

  return engine;
};
