'use strict';

angular.module('peerflixServerApp')
  .controller('MainCtrl', function ($scope, $resource) {
    var torrents = $resource('/torrents');
    var files = torrents.query(function () {
      $scope.files = files;
    });
  });
