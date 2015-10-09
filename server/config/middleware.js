var bodyParser = require('body-parser');
var helpers = require('./helpers.js'); // our custom middleware
var db = require('../db/db.js');
var path = require('path');
var fs = require('fs');
var gm = require('gm');
var Game = require('../game/game.js')
var session = require('express-session');

// store all of the current games
var games = {};

module.exports = function (app, express) {
  // Express 4 allows us to use multiple routers with their own configurations

  //app.use(morgan('dev'));
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(express.static(__dirname + '/../../client'));  //rename to whatever the client location is.

  // *********Set up our routes to manage calls to our REST API.

  app.use(session({
    secret: 'shhh, it\'s a secret',
    resave: false,
    saveUninitialized: true
  }));

  //*******************************
  // GET Requests
  //*******************************

  app.get('/imageGallery', function(req, res) {
    var files = [];
    var exclude = ['foo.txt'];

    fs.readdir(__dirname + '/../../client/uploads', function(err, fileList) {
      if (err) {
        throw err;
      }

      for (var i = 0; i < fileList.length; i++) {
        if (exclude.indexOf(fileList[i]) === -1){
          files.push('/uploads/' + fileList[i]);
        }
      }
      res.json(files);
    });
  });

  app.get('/game', function(req, res){
    var game = new Game();
    games[game.gameCode] = game;
    res.send(game.gameCode);
  });

  app.get('/game/:gameCode/status', function(req, res){
    var gameCode = req.params.gameCode;
    var game = games[gameCode]; 
    // if the game exists in the database
    if (game) {
      game.checkFinalImage(function(finalImageURL) {
        res.send(finalImageURL);
      }, function() {
        if (helpers.hasSession(req)) {
          helpers.getPlayerSession(req, res, game, function(responseObj) {
            res.send(responseObj);
          });
        } else {
          res.send({});
        }
      });
    } else {
      game.checkFinalImage(function(image) {
        //Add finalImage to database
        fs.readFile('client' + image.imageURL, function(err, data){
          if (err) { 
            throw err;
          }
          //Create new drawing with properties
          db.drawing.findOneAndUpdate({ gameCode: gameCode }, { players: [game.players[0], game.players[1], game.players[2], game.players[3]], drawing: data, gameCode: gameCode, contentType: 'image/png' }, { upsert: true, 'new': true }, function (err, drawing) {
            if (err) {
              throw err;
            }
            res.send(image);
          });
        });
      }, function(err) {
        if (helpers.hasSession(req, game)) {
          helpers.getPlayerSession(req, res, game, function(responseObj) {
            res.send(responseObj);
          }); 
        }
      });
    }
  });

  app.get('/game/:gameCode', function(req, res){

    var gameCode = req.params.gameCode;
    var game = games[gameCode];

    game.checkFinalImage(function(image) {
        //Add finalImage to database
        fs.readFile('client' + image.imageURL, function(err, data){

          if (err) {
            throw err;
          }
          db.drawing.findOneAndUpdate({ gameCode: gameCode }, { players: [game.players[0], game.players[1], game.players[2], game.players[3]], drawing: data, gameCode: gameCode, contentType: 'image/png' }, { upsert: true, 'new': true }, function (err, drawing) {
            if (err) {
              throw err;
            }
            res.send(image);
          });
        });
      }, function() {
      // if the user does not already have a session
      if(!helpers.hasSession(req)){

        if(!game){
          var gameObj = {game_does_not_exist: true};
          res.send(gameObj);
        } else {
          // check to see if the game is not full
          if(game.players.length < game.numPlayers){
            // create a new player (because this player, as you recall, does not have a session yet)
            helpers.createPlayer(req, res, game, function(gameData) {
              res.send(gameData);
            }); 
          } else if(game.submissionCount === game.players.length){
            // the game is full.
            // if the game is COMPLETED (that means that the final image has been drawn on the server),
            game.resolveFinishedGame(function(imageData) {
              res.send(imageData);
            });
          }
        }
      } else {
        helpers.getPlayerSession(req, res, game, function(response) {
          res.send(response);
        }); 
        // if they have seen the game board but haven't submitted their drawing
          // make them finish their drawing, probably by redirecting them to /draw
        // if the user HAS submitted their drawing, send them to the wait screen
      }
    });
  });

  app.get('/imageGallery', function(req, res){
    db.drawing.find({}, function(err, drawings){
      var base64Image;
      var bufferedImage;

      //Iterate through the drawings in the database, creating a file with standard naming conventions each time
      for (var i = 0; i < drawings.length; i++) {
        base64Image = drawings[i].drawing.toString('base64');
        bufferedImage = new Buffer(base64Image, 'base64');
        fs.writeFileSync('client/uploads/' + drawings[i].game_code + '.png', bufferedImage, 'base64');
      }
      res.json(drawings);
    });
  });

  app.get('/gameInfo/:gameCode', function(req, res) {
    var gameCode = req.params.gameCode;
    var game = games[gameCode];

    var responseObj = {};

    responseObj['game'] = game;
    responseObj['userId'] = req.session.user;

    res.json(responseObj);
  });

  //*******************************
  // POST Requests
  //*******************************

  //submits a game image and handles the logic for drawing the final image.
  app.post('/game/:gameCode', function(req, res){
    var image = req.body.image;
    var gameCode = req.params.gameCode;
    var username = req.session.user;
    var game = games[gameCode];

    //Generate the image URL with the name.
    var imagePath = path.join(__dirname, '/../assets/drawings/', gameCode + username +'.png');
    var imageBuffer = helpers.decodeBase64Image(image);
    //First we create the image so we can use it to create the player.
    // image is created as a base 64 string

    //writes image to a file.
    fs.writeFile(imagePath, imageBuffer.data, function(err){
      if(err){
        console.log("There was an error: " + err);
        res.sendStatus(500);
      } else {        
        game.players[username].submitted = true;
        game.submissionCount++;

        game.players[username].imagePath = imagePath;
        //This function updates the game with the new player data.
        game.update(function() {
          res.sendStatus(201);
        });
      }
    });
  });

  /* Write all completed images to uploads directory */

  app.use(helpers.errorLogger);
  app.use(helpers.errorHandler);

};
