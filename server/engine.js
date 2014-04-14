'use strict';
var torrentStream = require('torrent-stream'),
  _ = require('lodash');

module.exports = function (magnetUri, opts) {
  var engine = torrentStream(magnetUri, _.clone(opts, true));

  engine.once('verifying', function () {
    console.log('verifying ' + magnetUri.infoHash);
    engine.files.forEach(function (file, i) {
      console.log(i + ' ' + file.name);
    });
  });

  engine.once('ready', function () {
    console.log('ready ' + magnetUri.infoHash);
    //engine.swarm.pause();
  });

  engine.on('uninterested', function () {
    console.log('uninterested ' + magnetUri.infoHash);
    //engine.swarm.pause();
  });

  engine.on('interested', function () {
    console.log('interested ' + magnetUri.infoHash);
    //engine.swarm.resume();
  });

  engine.on('error', function (e) {
    console.log('error ' + magnetUri.infoHash + ': ' + e);
  });

  engine.on('destroyed', function () {
    console.log('destroyed ' + magnetUri.infoHash);
    engine.removeAllListeners();
  });

  return engine;
};
