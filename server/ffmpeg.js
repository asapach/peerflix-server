'use strict';

var path = require('path'),
  fs = require('fs'),
  pump = require('pump');

module.exports = function (req, res, torrent, file) {
  var param = req.query.ffmpeg,
    ffmpeg = require('fluent-ffmpeg');

  function probe() {
    var filePath = path.join(torrent.path, file.path);
    fs.exists(filePath, function (exists) {
      if (!exists) {
        return res.send(404, 'File doesn`t exist.');
      }
      return ffmpeg.ffprobe(filePath, function (err, metadata) {
        if (err) {
          console.error(err);
          return res.send(500, err.toString());
        }
        res.send(metadata);
      });
    });
  }

  function remux() {
    res.type('video/webm');
    var command = ffmpeg(file.createReadStream())
      .videoCodec('libvpx').audioCodec('libvorbis').format('webm')
      .audioBitrate(128)
      .videoBitrate(1024)
      .outputOptions([
        //'-threads 2',
        '-deadline realtime',
        '-error-resilient 1'
      ])
      .on('start', function (cmd) {
        console.log(cmd);
      })
      .on('error', function (err) {
        console.error(err);
      });
    pump(command, res);
  }

  switch (param) {
    case 'probe':
      return probe();
    case 'remux':
      return remux();
    default:
      res.send(501, 'Not supported.');
  }
};
