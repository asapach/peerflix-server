'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('peerflixServerApp'));

  var MainCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend) {
    $httpBackend.expectGET('/torrents').respond([
      { name: 'foo' },
      { name: 'bar' }
    ]);
    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope
    });
  }));

  afterEach(inject(function ($httpBackend) {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));

  it('should attach a list of files to the scope', inject(function ($httpBackend) {
    $httpBackend.flush();
    expect(_.pluck(scope.files, 'name')).toEqual(['foo', 'bar']);
  }));
});
