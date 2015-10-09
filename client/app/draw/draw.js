angular.module('spliced.draw', [])

.controller('DrawController', function ($rootScope, $scope, $http, $route, Draw, $q, $location, $timeout) {
  // drawing info will go here.

  $scope.data = {};

  $scope.load = false;

  $scope.data.penColor = '#000';
  $scope.data.penColors = [
    '#000', // black
    '#F00', // red
    '#0F0', // green
    '#00F', // blue
    '#FF0', // yellow
    '#0FF', // cyan
    '#F0F', // magenta
    '#FFF'  // white
  ];
  $scope.data.tool = 'paint';

  $scope.data.drawing = {};

  // This drawing.version counter is for the Undo button that comes with the angular canvas painting directive.
  // DON'T DELETE IT or the Undo button will break! 

  $scope.data.drawing.version = 0;

  $scope.undo = function() { 
    $scope.data.drawing.version--;
  };

  $scope.reset = function() {
    $scope.data.drawing.version = 0;
  } 

  // If the image has been submitted, we'll show the user a success message

  $scope.data.submitted = $scope.data.submitted || false;
  $scope.data.success = "Success! Your image has been submitted!"

  // This grabs the game code, generated at the home screen, and passes it into our save function.

  $scope.data.gameCode = $route.current.params.code;

  // On the server side, we sent a randomly generated template ID. This template
  // ID will give them one of several sets of templates with pre-drawn dots. It'll also assign which part
  // of the body the user should be drawing (i.e. head, body1, body2, feet), based on their userID, which
  // was sent back. The userID is 0, 1, 2, or 3, depending on who hit the server first. It's a
  // first-come first-served dealio. 

  $scope.data.hideBackground = false;

  var templateId;
  var backgroundId;
  var startTime;
  var gameLength;

  var updateTime = function() {
    var startDate = new Date(startTime);
    $rootScope.timeRemaining = (startDate.setSeconds(startDate.getSeconds() + gameLength) - Date.now())
    if($rootScope.timeRemaining > 0) {
      $timeout(updateTime);
    } else {
      $scope.save();
    }
  };

  Draw.getGameInfo($scope.data.gameCode).then(function(gameInfo){
    templateId = gameInfo.game.template;
    background = gameInfo.game.background;
    $scope.data.userId = gameInfo.userId;
    startTime = gameInfo.game.startTime;
    gameLength = gameInfo.game.gameLength;
    // all templates are stored inside assets/bg/. Feel free to add more! :) 
    $scope.data.templateSrc = '/assets/bg/' + templateId + '-' + $scope.data.userId + '.png';
    $scope.data.background = '/assets/bg/' + background + '-' + $scope.data.userId + '.png';
    $scope.load = true;
    updateTime();
  });

  // We need this so we can tell the user which part of the drawing they're using. Check out {{ data.bodyPart[data.userId] }}. 
  $scope.data.bodyPart = {
    0: $rootScope.strings.upperBodyHead,
    1: $rootScope.strings.upperBodyNeck,
    2: $rootScope.strings.lowerBodyWaist,
    3: $rootScope.strings.lowerBodyKnees,
  };

  // This function grabs the canvas HTML element and turns it into a base64 encoded image -- that's what
  // `toDataURL() does`. Then it asks the Draw service to take the drawing, as well as the game code and cookie data
  // (just for kicks). Finally, on clicking save, the $scope.data.submitted property is set to true, which triggers
  // the success message.

  $scope.save = function() {
    var image = document.getElementById("pwCanvasMain").toDataURL();
    Draw.save(image, $scope.data.gameCode);
    // $scope.data.submitted = true;
    // send the image to the server.
    
    var newLocation = '/game/' + $scope.data.gameCode + '/status';
    $location.path(newLocation);
  };

  $scope.toggleBackground = function() {
    $scope.data.hideBackground = !$scope.data.hideBackground;
  };
  // $scope.getGameStatus = function() {
  //   console.log("Getting the game status for", $scope.data.gameCode);
  //   Draw.getGameStatus($scope.data.gameCode).then(function(gameData) {
  //     console.log("The gameData is...", gameData);
  //     // if the game has the property imageURL
  //     if (gameData.hasOwnProperty("imageURL")) {
  //       // direct user to /result page

  //     }
  //     var submittedDrawing = $scope.data.gameCode + '_submitted_drawing';
  //     if (gameData[submittedDrawing]) {
  //       console.log("You submitted a drawing!!!!");
  //       console.log("Forwarding you to /#/game/:code/status");
  //       var newLocation = '/game/' + $scope.data.gameCode + '/status';
  //       $location.path(newLocation);
  //     }
  //   });
  // };



});
