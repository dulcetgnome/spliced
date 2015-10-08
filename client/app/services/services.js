angular.module('spliced.services', [])

.factory('Draw', function($http, $location) {
  var services = {};

  // This makes a POST request and sends the image to the server.
  services.save = function(image, gameCode) {
    // write post request here! :)
    $http.post('/game/' + gameCode, { image: image } )
    .then(function(response) {
      console.log("The response is", response);
    }, function(err) {
      console.log("The error is", err);
    });
  };

  // This makes a GET request to the game, which returns a game code to us
  services.createGame = function(callback) {
    $http.get('/game')
    .then(function (gameCode) {
      callback(gameCode.data)
    }, function(err) {
      console.log('There was an error getting the game code.');
    });
  };

  // This makes a POST request to the server and takes the user to the /draw page if
  // the player was successfully registered. 
  services.registerPlayer = function(gameCode, callback){
    $http.get('/game/' + gameCode )
    .then(function(response){
      console.log("This is the response.data from registerPlayer()", response.data);
      var submittedDrawing = response.data[gameCode + '_submitted_drawing'];
      if (response.data.game_does_not_exist) {
        console.log("The game does not exist");
        $location.path('/');
      } else {
        if (submittedDrawing === true) {
          var newUrl = '/game/' + gameCode + '/status';
          $location.path(newUrl);
        } else {
          var newUrl = '/game/' + gameCode + '/draw';
          $location.path(newUrl);
        }
        if (response.data.imageURL){
          console.log("Forwarding you to /#/game/:code/status");
          var newLocation = '/game/' + gameCode + '/status';
          $location.path(newLocation);
        }
        console.log(newUrl);
        console.log(response);
      }
    }), function(err){
      console.log("There was an error registering the player", err);
    };
  };

  // This gets the game status. If the game doesn't exist, then it'll redirect the user back to
  // home (#).
  services.getGameStatus = function(gameCode, callback) {
    console.log("Getting game data...");
    return $http.get('/game/' + gameCode + '/status')
    .then(function(response){
      return response.data;
    });
  };

  // This makes a GET request for saved images
  services.getImages = function(callback) {
    return $http.get('/imageGallery')
    .then(function (images) {
      return images.data;
    }, function(err) {
      console.log('There was an error getting the images.');
    });
  };

  services.getGameInfo = function(gameCode) {
    return $http.get('/gameInfo/' + gameCode)
    .then(function (info) {
      console.log('Info from service: ', info);
      return info.data;
    }, function(err) {
      console.log('There was an error getting the user session.');
    });
  }

  return services;
});