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
  this.startTime = new Date()
};

Game.prototype.createUniqueGameCode = function(){
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";

  for( var i=0; i < 4; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

Game.prototype.update = function (callback) {
  if (this.submissionCount === this.numPlayers) {
    this.makeImages(function(err) {
      if (err) {
        throw err;
      }
      callback();
    });
  }
};

Game.prototype.addPlayer = function (player) {
  if this.players.length < 4 {
    this.players.push(player);
  }
};

Game.prototype.makeImages = function(callback) {

    var readStream = fs.createReadStream("server/assets/drawings/" + this.gameCode + "0.png");
    // using http://aheckmann.github.io/gm/docs.html#append

    gm(readStream)
    //This is not scalable for N players.  You'll need to append these in some kind of loop.
    .append("server/assets/drawings/" + this.gameCode + "1.png", "server/assets/drawings/" + this.gameCode + "2.png", "server/assets/drawings/" + this.gameCode + "3.png")
    .write('client/uploads/' + this.gameCode + '.png', function (err) {
      if (err) {
        console.log("There was an error creating the exquisite corpse:", err);
        callback(err);
      } else {
        this.drawingFinished = true;
        callback();
      }

    }.bind(this));
  },

Game.prototype.checkFinalImage = function(finalImageReadyCallback, gameInProgressCallback) {

    // **NB** this finalImageURL is hard coded right now, but later it should be path_to_images/gameID.png
    var finalImageURL = 'client/uploads/' + this.gameCode + '.png';
    // first, check to see if the final image exists.
    fs.stat(finalImageURL, function(err, res) {
      if (err) {
        gameInProgressCallback(err);
      } else {
        // if the image exists, then send the path to the image onward.
        var fixedFinalImageURL = finalImageURL.slice(6);
        finalImageReadyCallback({imageURL: fixedFinalImageURL});
      }
    });
  }

Game.prototype.resolveFinishedGame = function (callback) {
    if (this.drawingFinished) {
      this.checkFinalImage(this.gameCode, function() {
        var imageURL = '/client/uploads' + this.gameCode + '.png';
        // we need to send it back.
        callback({imageURL: imageURL});
      });
    } else {
      res.sendStatus(500);
      // if the drawing got messed up or never got completed
        // we will try to draw it again.
    }
  }

module.exports = Game;
