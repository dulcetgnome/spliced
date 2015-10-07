var bodyParser = require('body-parser');
var helpers = require('./helpers.js'); // our custom middleware
var db = require('../db/db.js');
var path = require('path');
var fs = require('fs');
var gm = require('gm');
var cookieParser = require('cookie-parser');
var session = require('express-session');


module.exports = function (app, express) {
  // Express 4 allows us to use multiple routers with their own configurations

  app.use(cookieParser());
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

  app.get('/imageGallery', function(req, res) {
    var files = [];
    var exclude = ['foo.txt'];

    fs.readdir(__dirname + '/../../client/uploads', function(err, fileList) {
      if (err) {
        throw err;
      }

      for (var i = 0; i < fileList.length; i++) {
        if (exclude.indexOf(fileList[i]) === -1) {
          files.push('/uploads/' + fileList[i]);
        }
      }
      res.json(files);
    });
  });

  app.get('/game', function(req, res){
    helpers.createNewGame(res);
  });

  app.get('/game/:gameCode/status', function(req, res){
    console.log("getting game status");
    var gameCode = req.params.gameCode; 
    // if the game exists in the database
    db.game.findOne({game_code: gameCode}, function(err, game) {
      if (err) {
        console.log(err);
        // res.sendStatus(404);
      }
      if (!game) {
        console.log('no game')
        res.sendStatus(404);
      } else {
        console.log('checking for final image')
        helpers.checkFinalImage(gameCode, function(image) {
          //Add finalImage to database
          fs.readFile('client' + image.imageURL, function(err, data){

            if (err) { throw err };
            //Find the current game to get players and game code
            db.game.findOne({ game_code: req.params.gameCode }, '_id 0 1 2 3 game_code', function(err, game){
              //Create new drawing with properties
              db.drawing.findOneAndUpdate({ game_code: game['game_code'] }, { players: [game[0], game[1], game[2], game[3]], drawing: data, game_code: game['game_code'], content_type: 'image/png' }, { upsert: true, 'new': true }, function (err, drawing) {
                if (err) { throw err };
                res.send(image);
              });
            });
          });
        }, function(err) {
          console.log('There is no final image yet');
          if (helpers.hasSession(req, gameCode)) {
            console.log("The player has a session");
            helpers.getPlayerSession(req, res, gameCode); 
          } else {
            console.log("This is a new player, they have no session yet");
            res.send({});
          }
          // res.sendStatus(201);
        })
      }
    })
  });

  app.get('/game/:gameCode', function(req, res){

    var code = req.params.gameCode;

    //This helper function takes three arguments. The game code, a callback to be executed if the game is done, and a callback to be executed if the game is still in progress.
    helpers.checkFinalImage(code, function(image) {
        //Add finalImage to database
        fs.readFile('client' + image.imageURL, function(err, data){

          if (err) { throw err };
          //Find the current game to get players and game code
          db.game.findOne({ game_code: req.params.gameCode }, '_id 0 1 2 3 game_code', function(err, game){
            //Create new drawing with properties
            db.drawing.findOneAndUpdate({ game_code: game['game_code'] }, { players: [game[0], game[1], game[2], game[3]], drawing: data, game_code: game['game_code'], content_type: 'image/png' }, { upsert: true, 'new': true }, function (err, drawing) {
              if (err) { throw err };
              res.send(image);
            });
          });
        });
      }, function() {

      // if the user does not already have a session
      if(!helpers.hasSession(req, code)){

        // create a session for the player.
        // query the database for the game using the game code
        db.game.findOne({game_code: code}, function(err, game){

          // if the game doesn't exist, 404.
          if(!game){
            console.log("No game was found for code: ", code);
            var gameObj = {game_does_not_exist: true};
            res.send(gameObj);
          // if the game DOES exist
          } else {
            console.log("Game player count is:", game.player_count, "For a game of:", game.num_players, "players");

            // check to see if the game is not full
            if(game.player_count < game.num_players){
              // create a new player (because this player, as you recall, does not have a session yet)
              helpers.createPlayer(req, res, game, code); 
            } else if(game.submission_count === game.num_players){
              // the game is full.
              // if the game is COMPLETED (that means that the final image has been drawn on the server),
              helpers.resolveFinishedGame(game);
            } //TODO: Make something here that will tell people the game is in progress.
          }
        });
      // if the user already has a session
      } else {
        console.log("Hello, the user already has a session");
        helpers.getPlayerSession(req, res, code); 
        // if they have seen the game board but haven't submitted their drawing
          // make them finish their drawing, probably by redirecting them to /draw
        // if the user HAS submitted their drawing, send them to the wait screen
      }
    });
  });

  //submits a game image and handles the logic for drawing the final image.
  app.post('/game/:gameCode', function(req, res){
    var image = req.body.image;
    var cookieData = req.body.cookieData;
    var gameCode = req.params.gameCode;
    console.log("The game's player ID: ", cookieData[gameCode+"_playerName"]);
    var username = cookieData[gameCode+"_playerName"];

    //Generate the image URL with the name taken from the cookie propeties.
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
        //db.player.update or insert
        //this finds the user document in the db and either creates it or updates it (if it already exists).
        db.player.findOneAndUpdate({game_code: gameCode, user_name: username}, {image:imagePath, submitted_drawing: true}, {upsert: true, 'new': true}, function (err, player) {
          console.log("Player updated with Image URL, calling helpers.updateGame");
          //This function updates the game with the new player data.
          helpers.updateGame(player, gameCode, res);
        });
        console.log("File write success");
      }
    });
  });

  /* Write all completed images to uploads directory */
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

  app.use(helpers.errorLogger);
  app.use(helpers.errorHandler);

};
