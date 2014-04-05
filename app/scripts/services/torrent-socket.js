'use strict';

angular.module('peerflixServerApp')
  .factory('torrentSocket', function (socketFactory) {
    /* global io: false */
    return socketFactory({ ioSocket: io.connect(':8111') });
  });
