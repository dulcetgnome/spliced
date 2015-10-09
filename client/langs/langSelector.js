angular.module('spliced.index', [])

.controller('LangSelector', function ($rootScope, $scope) {
  $scope.data = {};


  var languages = {
    enUS: enUS,
    esES: esES,
    frFR: frFR,
    itIT: itIT,
    jaJP: jaJP
  };

  $rootScope.strings = angular.extend({}, languages.enUS);

  $scope.chooseLanguage = function(lang) {
    angular.extend($rootScope.strings, languages[lang]);
  };
});