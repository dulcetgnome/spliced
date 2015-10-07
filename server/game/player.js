var Player = function(id) {
  this.playerId = id;
  this.startedDrawing = false;
  this.submitted = false;
}

module.exports = Player;

// fix the name!!!
var something = function (err, player) {
// console.log("New player", userName, "Has been added to game:", code);
// console.log("We are making cookies!");
res.cookie(code + '_playerName', player.user_name, { maxAge: 900000, httpOnly: false});
res.cookie(code + '_playerID', player._id,{ maxAge: 900000, httpOnly: false});
res.cookie(code, true, { maxAge: 900000, httpOnly: false});
req.session.user = player._id;
// console.log("The cookies are:", res.cookie);
// once the player has been added, we'll update the game table with the new player's info
// this update also includes count++
// console.log("We're creating the player. the Player is:", player);
var gameObj = {};
gameObj.$inc = {'player_count':1};
gameObj[userName] = player.id;
console.log("Console logging gameObj", gameObj);
db.game.findOneAndUpdate({game_code: code}, gameObj, function(err, game){
  if(err){
    console.log(err);
  } else {
    // console.log("GET GAME: This is the game data", game);
    // send game back to client.
    res.cookie('templateId', game.template,{ maxAge: 900000, httpOnly: false});
    res.send({game: game, player: player});
    if(callback){
      callback(player);
    }
  }

  
createPlayer: function(req, res, game, code, callback) {

    var userName = game.player_count;
    console.log("When we create the player, the code is", code);

    // add this player to the database.
    db.player.findOneAndUpdate(
      {user_name: userName,
       game_code: code},
       {user_name: userName,
       counted: false,
       game_code: code,
       started_drawing: true},
       {upsert: true,
       'new': true},
       

      });
    });
  },

  function (err, player) {
      // console.log("New player", userName, "Has been added to game:", code);
      // console.log("We are making cookies!");
      res.cookie(code + '_playerName', player.user_name, { maxAge: 900000, httpOnly: false});
      res.cookie(code + '_playerID', player._id,{ maxAge: 900000, httpOnly: false});
      res.cookie(code, true, { maxAge: 900000, httpOnly: false});
      req.session.user = player._id;
      // console.log("The cookies are:", res.cookie);
      // once the player has been added, we'll update the game table with the new player's info
      // this update also includes count++
      // console.log("We're creating the player. the Player is:", player);
      var gameObj = {};
      gameObj.$inc = {'player_count':1};
      gameObj[userName] = player.id;
      console.log("Console logging gameObj", gameObj);
      db.game.findOneAndUpdate({game_code: code}, gameObj, function(err, game){
        if(err){
          console.log(err);
        } else {
          // console.log("GET GAME: This is the game data", game);
          // send game back to client.
          res.cookie('templateId', game.template,{ maxAge: 900000, httpOnly: false});
          res.send({game: game, player: player});
          if(callback){
            callback(player);
          }
        }

  getPlayerSession: function(req, res, code) {
    // check if the user has submitted their drawing.
    console.log("-----------------------");
    console.log("getting the player session...");
    console.log("-----------------------");
    console.log(req.cookies);
    var username = req.cookies[code + '_playerID'];
    console.log('username is', username);
    db.player.findOne({game_code: code, _id: username}, function(err, player) {
      console.log("inside db.player.findOne in getPlayerSession");
      if (err) console.log("There was an error finding the user by their ID", err)
      // if the user has submitted their drawing
      if (player) {
        if (player.submitted_drawing) {
          // show them a please wait screen (perhaps with a reload button so they can see the final image)
          console.log("The player has submitted a drawing. Let's not let them make a new drawing");
          var codeAndDrawingStatus = code + '_' + 'submitted_drawing';
          var responseObj = {};
          responseObj[codeAndDrawingStatus] = true;
          res.send(responseObj);
        } else if (!player.submitted_drawing && player.started_drawing) {
          console.log("The player has started drawing, but hasn't submitted yet.");
          var codeAndDrawingStatus = code + '_' + 'submitted_drawing';
          var responseObj = {};
          responseObj[codeAndDrawingStatus] = false;
          res.send(responseObj);
        }
        console.log(player);
      }
    });
  },