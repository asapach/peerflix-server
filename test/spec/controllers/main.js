'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('peerflixServerApp'));

  var MainCtrl, torrentSocket, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
    $httpBackend.expectGET('/torrents').respond([
      { files: ['foo', 'bar']}
    ]);
    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope,
      torrentSocket: torrentSocket = jasmine.createSpyObj('torrentSocket', ['on'])
    });
  }));

  afterEach(inject(function ($httpBackend) {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));

  it('should attach a list of files to the scope', inject(function ($httpBackend) {
    $httpBackend.flush();
    expect(scope.torrents[0].files).toEqual(['foo', 'bar']);
  }));
});
