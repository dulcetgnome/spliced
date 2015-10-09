angular.module('spliced.index', [])

.controller('IndexController', function ($rootScope, $scope, Strings) {
  $scope.data = {};

  $rootScope.strings = enUS;

  $scope.data.test = "Hello World!";

  // $rootScope.strings = enUS;

  $scope.chooseEnglish = function() {
    $rootScope.strings = enUS;
  };

  $scope.chooseSpanish = function() {
    $rootScope.strings = esES;
  };

  $scope.chooseFrench = function() {
    $rootScope.strings = frFR;
  };
  
  $scope.chooseItalian = function() {
    $rootScope.strings = itIT;
  };

});