'use strict';

var request = require('request');

var APPNET_URL = 'https://alpha-api.app.net';

exports.userPosts = function(req, callback) {
  var user = req.params.user_id || req.session.passport.user;

  request.get(APPNET_URL + '/stream/0/users/' + user.id + '/posts' +
    '?since_id=' + req.body.since_id,
    function(err, resp, body) {

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
    user.access_token + '&since_id=' + req.body.since_id,
    function(err, resp, body) {

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

exports.myMentions = function(req, callback) {
  var user = req.session.passport.user;

  request.get(APPNET_URL + '/stream/0/users/' + user.id + '/mentions?access_token=' +
    user.access_token + '&since_id=' + req.body.since_id,
    function(err, resp, body) {

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

exports.globalFeed = function(req, callback) {
  request.get(APPNET_URL + '/stream/0/posts/stream/global?since_id=' + req.body.since_id,
    function(err, resp, body) {

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

exports.addMessage = function(req, callback) {
  var user = req.session.passport.user;

  var qs = {
    text: req.body.message,
    reply_to: req.body.reply_to || null
  };

  var params = {
    url: APPNET_URL + '/stream/0/posts?access_token=' + user.access_token,
    form: qs
  };

  request.post(params, function(err, resp, body) {
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
