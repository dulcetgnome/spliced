var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});
var db = require('../db/db.js');
var Game = require('../game/game.js')
var Player = require('../game/player.js')
var session = require('express-session');
var cookieParser = require('cookie-parser');


module.exports = {
  errorLogger: function (error, req, res, next) {
    // log the error then send it to the next middleware in
    // middleware.js

    console.error(error.stack);
    next(error);
  },
  errorHandler: function (error, req, res, next) {
    // send error message to client
    // message for gracefull error handling on app
    res.send(500, {error: error.message});
  },

  hasSession: function (req) {
    //return req.session ? !!req.session.user : false;
    return req.session.user !== undefined;
  },

  decodeBase64Image: function(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};

    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }
    response.type = matches[1];
    console.log("response.type is", response.type);
    response.data = new Buffer(matches[2], 'base64');

    return response;
  },

  //Create a new player for a specific game.
  createPlayer: function(req, res, game, callback) {

    var userId = game.players.length;

    if (userId === 0) {
      game.startTime = new Date();
      setTimeout(function() {
        if (!game.drawingFinished) {
          game.makeImages(function() {
            //res.sendStatus(201);
          });
        }
      }, (game.gameLength + 10) * 1000);
    }

    // create a player object
    var player = new Player(userId);
    req.session.user = player.playerId;
    player.startedDrawing = true;
    
    // add player to game
    game.players.push(player);

    callback({game: game, player: player});
  },

  getPlayerSession: function(req, res, game, callback) {
    // we have already checked that the player has a session in midleware.js
    // so we are assuming it is valid data
    // check if the user has submitted their drawing.
    var username = req.session.user;
    var player = game.players[username] || {};

    var codeAndDrawingStatus = game.gameCode + '_' + 'submitted_drawing';
    var responseObj = {};

    if (player.submitted) {
      responseObj[codeAndDrawingStatus] = true;
      callback(responseObj);
    } else {
      responseObj[codeAndDrawingStatus] = false;
      callback(responseObj);
    }
  },

}