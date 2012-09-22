'use strict';

var request = require('request');

var APPNET_URL = 'https://alpha-api.app.net';

exports.myPosts = function(req, callback) {
  var user = req.session.passport.user;

  request.get(APPNET_URL + '/stream/0/users/' + user.id + '/posts', function(err, resp, body) {
    if (err) {
      callback(err);
    } else {
      try {
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.myFeed = function(req, callback) {
  var user = req.session.passport.user;

  request.get(APPNET_URL + '/stream/0/posts/stream?access_token=' +
    user.access_token, function(err, resp, body) {

    if (err) {
      callback(err);
    } else {
      try {
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.globalFeed = function(callback) {
  request.get(APPNET_URL + '/stream/0/posts/stream/global', function(err, resp, body) {

    if (err) {
      callback(err);
    } else {
      try {
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};
