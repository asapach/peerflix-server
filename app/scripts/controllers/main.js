'use strict';

function openOverlay() {
  document.querySelector(".overlay").style.display = "block";
  document.querySelector(".overlay .backdrop").addEventListener("click", closeOverlay);
}

function closeOverlay() {
  document.querySelector(".overlay").style.display = "none";
  document.querySelector(".overlay video").src = "";
  document.querySelector(".overlay .backdrop").removeEventListener("click", closeOverlay);
}

/* global Push */
angular.module('peerflixServerApp')
  .controller('MainCtrl', function ($scope, $resource, $log, $q, $upload, torrentSocket) {

    // Get darkmode status from system
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.querySelector("html").classList.add("dark")
    }

    var Torrent = $resource('/torrents/:infoHash');
    var Search = $resource('/search/:param');

    function load() {
      var torrents = Torrent.query(function () {
        $scope.torrents = torrents.reverse();
      });
    }

    function loadTorrent(hash) {
      return Torrent.get({ infoHash: hash }).$promise.then(function (torrent) {
        var existing = _.find($scope.torrents, { infoHash: hash });
        if (existing) {
          var index = $scope.torrents.indexOf(existing);
          $scope.torrents[index] = torrent;
        } else {
          $scope.torrents.unshift(torrent);
        }
        return torrent;
      });
    }

    function findTorrent(hash) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      if (torrent) {
        return $q.when(torrent);
      } else {
        return loadTorrent(hash);
      }
    }

    load();

    function notifyFinished(torrent) {
      Push.create('Your torrent has finished downloading!', {
        body: torrent.name + ' has finished downloading.',
        icon: 'images/logo.png'
      });
    }

    $scope.clearSearch = function () {
      $scope.query = "";
      $scope.results = undefined;
    };

    $scope.keypressSearch = function (e) {
      if (e.which === 13) {
        $scope.search();
      }
    };

    $scope.search = function () {
      if ($scope.query) {
        $scope.results = undefined;
        Search.query({ param: $scope.query }).$promise.then(function (results) {
          $scope.results = results;
        })
      }
    };

    $scope.downloadSearchResult = function (link) {
      Search.save({ param: link }).$promise.then(function (torrent) {
        loadTorrent(torrent.infoHash);
      });
    };

    $scope.keypressDownload = function (e) {
      if (e.which === 13) {
        $scope.download();
      }
    };

    $scope.download = function () {
      if ($scope.link) {
        Torrent.save({ link: $scope.link }).$promise.then(function (torrent) {
          loadTorrent(torrent.infoHash);
        });
        $scope.link = '';
      }
    };

    $scope.upload = function (files) {
      if (files && files.length) {
        files.forEach(function (file) {
          $upload.upload({
            url: '/upload',
            file: file
          }).then(function (response) {
            loadTorrent(response.data.infoHash);
          });
        });
      }
    };

    $scope.pause = function (torrent) {
      torrentSocket.emit(torrent.stats.paused ? 'resume' : 'pause', torrent.infoHash);
    };

    $scope.select = function (torrent, file) {
      torrentSocket.emit(file.selected ? 'deselect' : 'select', torrent.infoHash, torrent.files.indexOf(file));
    };

    $scope.selectAll = function (torrent) {
      torrentSocket.emit(torrent.selected ? 'deselect' : 'select', torrent.infoHash);
      torrent.files.forEach(function (f) {
        f.selected = !torrent.selected;
      });
    };

    $scope.remove = function (torrent) {
      Torrent.remove({ infoHash: torrent.infoHash });
      _.remove($scope.torrents, torrent);
    };

    $scope.play = function (link) {
      document.querySelector(".overlay video").src = link;
      openOverlay();
    };

    $scope.isVideo = function (fileName) {
      fileName = fileName.toLowerCase();
      return [
        '.mkv',
        '.webm',
        '.mpg',
        '.mp2',
        '.mpeg',
        '.mpe',
        '.mpv',
        '.ogg',
        '.mp4',
        '.m4p',
        '.m4v',
        '.avi',
        '.wmv',
        '.mov',
        '.qt',
        '.flv',
        '.swf',
        '.avchd'
      ].some(function(ext) {
        return fileName.endsWith(ext)
      })
    };

    $scope.toggleDarkMode = function () {
      document.querySelector("html").classList.toggle("dark")
    };

    torrentSocket.on('verifying', function (hash) {
      findTorrent(hash).then(function (torrent) {
        torrent.ready = false;
      });
    });

    torrentSocket.on('ready', function (hash) {
      loadTorrent(hash);
    });

    torrentSocket.on('interested', function (hash) {
      findTorrent(hash).then(function (torrent) {
        torrent.interested = true;
      });
    });

    torrentSocket.on('uninterested', function (hash) {
      findTorrent(hash).then(function (torrent) {
        torrent.interested = false;
      });
    });

    torrentSocket.on('finished', function (hash) {
      findTorrent(hash).then(notifyFinished);
    });

    torrentSocket.on('stats', function (hash, stats) {
      findTorrent(hash).then(function (torrent) {
        torrent.stats = stats;
      });
    });

    torrentSocket.on('download', function (hash, progress) {
      findTorrent(hash).then(function (torrent) {
        torrent.progress = progress;
      });
    });

    torrentSocket.on('selection', function (hash, selection) {
      findTorrent(hash).then(function (torrent) {
        if (!torrent.files) {
          return;
        }
        for (var i = 0; i < torrent.files.length; i++) {
          var file = torrent.files[i];
          file.selected = selection[i];
        }
        torrent.selected = _.every(torrent.files, 'selected');
      });
    });

    torrentSocket.on('destroyed', function (hash) {
      _.remove($scope.torrents, { infoHash: hash });
    });

    torrentSocket.on('disconnect', function () {
      $scope.torrents = [];
    });

    torrentSocket.on('connect', load);
  });
