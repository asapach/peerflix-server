'use strict';
var torrentStream = require('torrent-stream');

var engine = torrentStream('magnet:?xt=urn:btih:4708aeff17180d777b4132bb589c8a0362815146&dn=Formula.1.2014.Bahrain.Grand.Prix.The.F1.Show.HDTV.x264-W4F.mp4&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&tr=udp%3A%2F%2Ftracker.publicbt.com%3A80&tr=udp%3A%2F%2Ftracker.istole.it%3A6969&tr=udp%3A%2F%2Ftracker.ccc.de%3A80&tr=udp%3A%2F%2Fopen.demonii.com%3A1337');

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
  console.log('pausing dht');
  engine.swarm.pause();
});

engine.on('interested', function () {
  console.log('resuming dht');
  engine.swarm.resume();
});

module.exports = engine;
