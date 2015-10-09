angular.module('spliced.ready', [])

.controller('ReadyController', function ($scope, $route, Draw, Strings, $location, $timeout) {

  $scope.data = {};


  // This property determines what the user sees on /#/game/:code. If the game is complete,
  // they'll see the final image. If not, they'll see a prompt that will allow them to enter the game.

  $scope.data.imageURL = $scope.data.imageURL || null;

  $scope.data.gameCode = $route.current.params.code;

  $scope.data.gameURL = window.location.href;

  $scope.data.submittedDrawing = $scope.data.submittedDrawing || false;

  // When the user hits the url /#/game/:code, we'll query the server for the status of the game.
  // if the server responds with an imageURL, then we'll show the final drawn image to the user!
  $scope.getGameStatus = function() {
    console.log("Getting the game status for", $scope.data.gameCode);
    Draw.getGameStatus($scope.data.gameCode).then(function(gameData) {
      console.log("The gameData is...", gameData);
      // if the game has the property imageURL
      if (gameData.hasOwnProperty("imageURL")) {
        console.log("There is an imageURL");

        // and we set the $scope's image URL to the imageURL from the response.
        $scope.data.imageURL = gameData.imageURL;
      } else{
        $timeout($scope.getGameStatus, 1000);
      }

      var submittedDrawing = $scope.data.gameCode + '_submitted_drawing';
      if (gameData[submittedDrawing]) {
        console.log("You submitted a drawing!!!!");
        $scope.data.submittedDrawing = true;
      }
    });
  };
  $scope.getGameStatus();
  // When the user clicks "Enter game", they are registered as a player. In the database, they will have
  // a new player object. They will also be added to the game object.
  $scope.registerPlayer = function() {
     Draw.registerPlayer($scope.data.gameCode);
  };
  //console.log("location.path: ", $location.path());
  if($location.path().indexOf("status") > -1){
    $scope.getGameStatus();
  }

});