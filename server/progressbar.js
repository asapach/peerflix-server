'use strict';

module.exports = function (buffer) {
  var pieces = buffer.toJSON(),
    progress = [],
    counter = 0,
    downloaded = true;

  pieces.forEach(function (p) {
    if (downloaded && p > 0 || !downloaded && p === 0) {
      counter++;
    } else {
      progress.push(counter);
      counter = 1;
      downloaded = !downloaded;
    }
  });

  progress.push(counter);

  return progress.map(function (p) {
    return p * 100 / pieces.length;
  });
};