var gm = require('gm').subClass({imageMagick: true});

var Game = function () {
  var randomTemplateNumber = Math.floor(math.random() * 5);

  this.gameCode = this.createUniqueGameCode();
  this.numPlayers = 4;
  this.players = [];
  this.submissionCount = 0;
  // this.gameStarted = true;
  this.drawingFinished = false;
  this.template = randomTemplateNumber,
  this.gameStartTime = new Date()
};

Game.prototype.createUniqueGameCode = function(){
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";

  for( var i=0; i < 4; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

Game.prototype.update = function (gameCode, res, callback) {
  if (this.submissionCount === this.numPlayers) {

  }
};

Game.prototype.addPlayer = function (player) {
  if this.players.length < 4 {
    this.players.push(player);
  }
};

Game.prototype.updateSubmissions = function (submission) {
  this.submissionCount++;
};

Game.prototype.makeImages = function(gameCode, numPlayers, callback) {
    console.log("---------");
    console.log("makeImages was invoked... making images");
    console.log("---------");

    var readStream = fs.createReadStream("server/assets/drawings/" + gameCode + "0.png");
    // using http://aheckmann.github.io/gm/docs.html#append

    var context = this;

    gm(readStream)
    //This is not scalable for N players.  You'll need to append these in some kind of loop.
    .append("server/assets/drawings/" + gameCode + "1.png", "server/assets/drawings/" + gameCode + "2.png", "server/assets/drawings/" + gameCode + "3.png")
    .write('client/uploads/' + gameCode + '.png', function (err) {
      console.log("Streaming the image now");
      if (err) {
        console.log("There was an error creating the exquisite corpse:", err);
      } else {
        context.drawingFinished = true;
      }

    });
  },

Game.prototype.checkFinalImage = function(code, finalImageReadyCallback, gameInProgressCallback) {

    // **NB** this finalImageURL is hard coded right now, but later it should be path_to_images/gameID.png
    var finalImageURL = 'client/uploads/' + code + '.png';
    // first, check to see if the final image exists.
    fs.stat(finalImageURL, function(err, res) {
      if (err) {
        gameInProgressCallback(err);
        console.log("The image", finalImageURL, "doesn't exist!");
      } else {
        // if the image exists, then send the path to the image onward.
        var fixedFinalImageURL = finalImageURL.slice(6);
        console.log("The final image URL was successfully retrieved from the server. It's", fixedFinalImageURL);
        finalImageReadyCallback({imageURL: fixedFinalImageURL});
      }
    });
  }

module.exports = Game;

updateGame: function(player, gameCode, res, callback) {
    //create a new game object
    var gameObj = {};
    console.log('player.id is ', player._id);
    // console.log('player.id is ', player.id);
    gameObj[player.user_name] = player._id;
    // console.log('gameObj[player.user_name] is ', gameObj[player.user_name]);
    //if the player has never submitted a drawing...
    if(!player.counted){
      //increment number of submitted drawings
      gameObj.$inc = {'submission_count':1};
      //update the player to know they have been counted
      db.player.findOneAndUpdate({user_name: player.user_name, game_code: gameCode}, {counted: true}, {upsert: true, 'new': true}, function (err, player) {
        console.log("Player count updated.");
      });
      //update the game with the new player information
      db.game.findOneAndUpdate({game_code: gameCode}, gameObj, {upsert: true, 'new': true}, function (err, game){
        //if all players have submitted drawings
        console.log('Game count VS number of players', game.submission_count, game.num_players);
        console.log("The gameObj", gameObj);
        if (game.submission_count === game.num_players) {
          console.log("Let's invoke the image stitcher function now");
          // invoke create unified image function
          module.exports.makeImages(gameCode, game.num_players, function() {
            if (err) throw err;
            console.log("Done drawing the image, check the image folder!");
            if(callback){
              callback();
            }
          });
        }
      });
    }
    console.log("I'm sending the status now!");
    return res.sendStatus(201);

  },


var gameSchema = new Schema({
  num_players : Number,
  player_count: Number,
  submission_count: Number,
  game_code: String,
  0 : String,
  1 : String,
  2 : String,
  3 : String,
  template: Number,
  gameStart: Date,
  game_started: Boolean,
  drawing_finished: Boolean
});

createNewGame: function(res){
    var code = this.createUniqueGameCode();
    var randomTemplateNumber = Math.floor(Math.random() * 5);
    // make a date so you can time when the game should end
    var now = new Date();
    var game = new db.game(

{game_code: code, 
  num_players: 4,
  player_count: 0,
  submission_count: 0,
  game_started: true,
  drawing_finished: false,
  0: null,
  1: null,
  2: null,
  3: null,
  template: randomTemplateNumber,
  gameStart: now}).save();
    console.log("the unique code is:" + code);
    res.send(code);
  },