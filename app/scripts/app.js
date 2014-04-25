'use strict';

angular
  .module('peerflixServerApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'btford.socket-io',
    'rt.encodeuri'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
