'use strict';
var torrentStream = require('torrent-stream');

module.exports = function (torrent, opts) {
  var engine = torrentStream(torrent, opts),
    infoHash = engine.swarm.infoHash.toString('hex');

  engine.once('verifying', function () {
    console.log('verifying ' + infoHash);
    engine.files.forEach(function (file, i) {
      console.log(i + ' ' + file.name);
    });
  });

  engine.on('ready', function () {
    console.log('ready ' + infoHash);
    //engine.swarm.pause();
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

  return engine;
};
