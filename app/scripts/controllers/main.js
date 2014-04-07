'use strict';

angular.module('peerflixServerApp')
  .controller('MainCtrl', function ($scope, $resource, $log, torrentSocket) {
    var Torrent = $resource('/torrents/:infoHash');
    var torrents = Torrent.query(function () {
      $scope.torrents = torrents;
    });

    $scope.download = function () {
      var torrent = new Torrent();
      torrent.link = $scope.link;
      torrent.$save();
      $scope.link = '';
    };

    $scope.pauseResume = function (torrent) {
      torrentSocket.emit(torrent.stats.paused ? 'resume' : 'pause', torrent.infoHash);
    };

    $scope.select = function (torrent, file) {
      torrentSocket.emit(file.selected ? 'deselect' : 'select', torrent.infoHash, torrent.files.indexOf(file));
    };

    torrentSocket.on('ready', function (hash) {
      $log.info('ready', hash);
      var torrent = _.find($scope.torrents, { infoHash: hash });
      if (!torrent) {
        torrent = Torrent.get({ infoHash: hash }, function () {
          $scope.torrents.unshift(torrent);
        });
      }
    });

    torrentSocket.on('interested', function (hash) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      torrent.interested = true;
    });

    torrentSocket.on('uninterested', function (hash) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      torrent.interested = false;
    });

    torrentSocket.on('stats', function (hash, stats) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      torrent.stats = stats;
    });

    torrentSocket.on('download', function (hash, progress) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      torrent.progress = progress;
    });
  });
