'use strict';

angular.module('peerflixServerApp')
  .controller('MainCtrl', function ($scope, $resource, $log, torrentSocket) {
    var Torrent = $resource('/torrents/:infoHash');
    var torrents = Torrent.query(function () {
      $scope.torrents = torrents;
    });

    $scope.download = function () {
      Torrent.save({ link: $scope.link });
      $scope.link = '';
    };

    $scope.pauseResume = function (torrent) {
      torrentSocket.emit(torrent.stats.paused ? 'resume' : 'pause', torrent.infoHash);
    };

    $scope.select = function (torrent, file) {
      torrentSocket.emit(file.selected ? 'deselect' : 'select', torrent.infoHash, torrent.files.indexOf(file));
    };

    $scope.remove = function (torrent) {
      Torrent.remove({ infoHash: torrent.infoHash });
    };

    torrentSocket.on('verifying', function (hash) {
      $log.info('verifying', hash);
      var torrent = _.find($scope.torrents, { infoHash: hash });
      if (!torrent) {
        torrent = Torrent.get({ infoHash: hash }, function () {
          $scope.torrents.unshift(torrent);
          torrent.verifying = true;
        });
      }
    });

    torrentSocket.on('ready', function (hash) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      torrent.verifying = false;
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

    torrentSocket.on('destroyed', function (hash) {
      _.remove($scope.torrents, { infoHash: hash });
    });
  });
