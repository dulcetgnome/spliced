angular.module('spliced.strings', [])

.factory('Strings', function() {
  var services = {};

  services.en = function() {
    return esES;
  }

  return services;
});