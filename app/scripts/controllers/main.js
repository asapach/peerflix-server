'use strict';

angular.module('peerflixServerApp')
  .controller('MainCtrl', function ($scope, $resource) {
    var Torrent = $resource('/torrents/:infoHash');
    var torrents = Torrent.query(function () {
      $scope.torrents = torrents;
    });

    $scope.download = function () {
      var torrent = new Torrent();
      torrent.link = $scope.link;
      torrent.$save();
    };
  });
