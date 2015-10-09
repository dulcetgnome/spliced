var gm = require('gm').subClass({imageMagick: true});
var fs = require('fs');

var Game = function () {
  var randomTemplateNumber = Math.floor(Math.random() * 5);
  /* Number will be number of background options */
  var randomBackgroundNumber = Math.floor(Math.random() * 5);

  this.gameCode = this.createUniqueGameCode();
  this.numPlayers = 4;
  this.players = [];
  this.submissionCount = 0;
  this.drawingFinished = false;
  this.template = randomTemplateNumber;
  this.background = randomBackgroundNumber;
  this.startTime = null;
  /* In seconds */
  this.gameLength = 120;
};

Game.prototype.createUniqueGameCode = function(){
  var text = "";
  var possible = "abcdefghijklmnopqrstuvwxyz";

  for( var i=0; i < 4; i++ ) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

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
  if (this.players.length < 4) {
    this.players.push(player);
  }
};

Game.prototype.makeImages = function(callback) {
  var picture = gm();
  var path = 'server/assets/';
  var ext = '.png';
  for (var i = 0; i < 4; i++) {
    if(fs.existsSync(path + 'drawings/' + this.gameCode + i + ext)) {
      picture.append(path + 'drawings/' + this.gameCode + i + ext);
    } else {
      picture.append(path + 'defaults/' + this.template + '-' + i + ext);
    }
  }
  picture.write('client/uploads/' + this.gameCode + ext, function (err) {
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
