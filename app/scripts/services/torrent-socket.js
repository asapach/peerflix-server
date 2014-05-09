'use strict';

angular.module('peerflixServerApp')
  .factory('torrentSocket', function (socketFactory) {
    return socketFactory();
  });
