var Player = function(id) {
  this.playerId = id;
  this.startedDrawing = false;
  this.submitted = false;
  this.imagePath = null;
};

module.exports = Player;
