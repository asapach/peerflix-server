'use strict';

module.exports = function progressbar(buffer) {
  var progress = [],
    counter = 0,
    downloaded = true;

  for (var i = 0; i < buffer.length; i++) {
    var p = buffer[i];
    if (downloaded && p > 0 || !downloaded && p === 0) {
      counter++;
    } else {
      progress.push(counter);
      counter = 1;
      downloaded = !downloaded;
    }
  }

  progress.push(counter);

  return progress.map(function (p) {
    return p * 100 / buffer.length;
  });
};
