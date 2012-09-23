'use strict';

var qs = require('querystring')
var request = require('request');

var APPNET_URL = 'https://alpha-api.app.net/stream/0';

exports.userPosts = function(req, callback) {
  var userId = req.params.id || req.session.passport.user.id;

  var params = {
    since_id: req.body.since_id,
    include_deleted: 0
  };

  request.get(APPNET_URL + '/users/' + userId + '/posts?' + qs.stringify(params),
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

exports.getUser = function(req, callback) {
  var user = req.session.passport.user;

  var params = {
    access_token: user.access_token,
    include_deleted: 0
  };

  request.get(APPNET_URL + '/users/@' + req.params.username + '?' + qs.stringify(params),
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

  var params = {
    access_token: user.access_token,
    since_id: req.body.since_id,
    include_deleted: 0
  };

  request.get(APPNET_URL + '/posts/stream?' + qs.stringify(params),
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

exports.userMentions = function(req, callback) {
  var user = req.session.passport.user;
  var userId = req.params.id || user.id;

  var params = {
    access_token: user.access_token,
    since_id: req.body.since_id,
    include_deleted: 0
  };

  request.get(APPNET_URL + '/users/' + userId + '/mentions?' + qs.stringify(params),
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

exports.userStarred = function(req, callback) {
  var user = req.session.passport.user;
  var userId = req.params.id || user.id;

  var params = {
    access_token: user.access_token,
    since_id: req.body.since_id,
    include_deleted: 0
  };

  request.get(APPNET_URL + '/users/' + userId + '/stars?' + qs.stringify(params),
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
  var params = {
    since_id: req.body.since_id,
    include_deleted: 0
  };

  request.get(APPNET_URL + '/posts/stream/global?'  + qs.stringify(params),
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
    url: APPNET_URL + '/posts?access_token=' + user.access_token,
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
