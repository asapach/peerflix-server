'use strict';
var torrentStream = require('torrent-stream'),
  _ = require('lodash');

module.exports = function (torrent, opts) {
  var engine = torrentStream(torrent, _.clone(opts, true));

  engine.once('verifying', function () {
    console.log('verifying ' + torrent.infoHash);
    engine.files.forEach(function (file, i) {
      console.log(i + ' ' + file.name);
    });
  });

  engine.once('ready', function () {
    console.log('ready ' + torrent.infoHash);
    engine.torrent.ready = true;
  });

  engine.on('uninterested', function () {
    console.log('uninterested ' + torrent.infoHash);
  });

  engine.on('interested', function () {
    console.log('interested ' + torrent.infoHash);
  });

  engine.on('error', function (e) {
    console.log('error ' + torrent.infoHash + ': ' + e);
  });

  engine.once('destroyed', function () {
    console.log('destroyed ' + torrent.infoHash);
    engine.removeAllListeners();
  });

  return engine;
};
