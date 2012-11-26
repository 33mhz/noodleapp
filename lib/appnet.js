'use strict';

var qs = require('querystring');
var request = require('request');
var userDb = require('./user');
var utils = require('./utils');
var markdownToEntities = require('./markdown-to-entities');

var APPNET_URL = 'https://alpha-api.app.net/stream/0';
var TIMEOUT = 20000;
var THREAD_MAX = 150;

var requestGet = function(url, params, callback) {
  request.get({ uri: APPNET_URL + url + '?' + qs.stringify(params), timeout: TIMEOUT },
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

var requestPost = function(params, callback) {
  request.post(params, function(err, resp, body) {
    if (err) {
      callback(err);
    } else {
      if (body.meta.code === 200) {
        callback(null, body);
      } else {
        callback(new Error('Could not post message'));
      }
    }
  });
};

var requestPut = function(params, callback) {
  request.put(params, function(err, resp, body) {
    if (err) {
      callback(err);
    } else {
      try {
        callback(null, body);
      } catch(err) {
        callback(err);
      }
    }
  });
};

var requestDelete = function(uri, callback) {
  request.del({ uri: APPNET_URL + uri, timeout: TIMEOUT },
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

exports.userPosts = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.params.id || utils.getUserId(req);
  var url = '/users/' + userId + '/posts';

  var params = {
    access_token: user.access_token,
    since_id: req.query.since_id,
    before_id: req.query.before_id,
    include_deleted: 0,
    include_annotations: 1
  };

  requestGet(url, params, callback);
};

exports.getUser = function(req, username, callback) {
  var user = utils.getUser(req);
  var url = '/users/@' + username;

  var params = {
    access_token: user.access_token
  };

  requestGet(url, params, callback);
};

exports.putUser = function(req, username, userInfo, callback) {
  var user = utils.getUser(req);
  var url = '/users/@' + username;

  var params = {
    url: APPNET_URL + url,
    qs: {
      access_token: user.access_token
    },
    json: userInfo
  };

  requestPut(params, callback);
};

exports.myFeed = function(req, client, callback) {
  var user = utils.getUser(req);
  var url = '/posts/stream';
  var directedFeed = 0;

  userDb.getLocalSettings(req, client, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      if (userItems.directedFeed === 'true') {
        directedFeed = 1;
      }

      var params = {
        access_token: user.access_token,
        since_id: req.query.since_id,
        before_id: req.query.before_id,
        include_deleted: 0,
        include_directed_posts: directedFeed,
        include_annotations: 1
      };

      requestGet(url, params, callback);
    }
  });
};

exports.userMentions = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.params.id || user.id;
  var url = '/users/' + userId + '/mentions';
  var count = null;

  if (req.query.count) {
    count = req.query.count;
  }

  var params = {
    access_token: user.access_token,
    since_id: req.query.since_id || '',
    before_id: req.query.before_id || '',
    include_deleted: 0,
    count: count,
    include_annotations: 1
  };

  requestGet(url, params, callback);
};

exports.userInteractions = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.params.id || user.id;
  var url = '/users/me/interactions';
  var count = null;

  if (req.query.count) {
    count = req.query.count;
  }

  var params = {
    access_token: user.access_token,
    since_id: req.query.since_id || '',
    before_id: req.query.before_id || '',
    include_deleted: 0,
    count: count,
    include_annotations: 1
  };

  requestGet(url, params, callback);
};

exports.userStarred = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.params.id || user.id;
  var url = '/users/' + userId + '/stars';

  var params = {
    access_token: user.access_token,
    before_id: req.query.before_id,
    include_deleted: 0,
    include_annotations: 1
  };

  requestGet(url, params, callback);
};

exports.globalFeed = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/stream/global';

  var params = {
    access_token: user.access_token,
    since_id: req.query.since_id,
    before_id: req.query.before_id,
    include_deleted: 0,
    include_annotations: 1
  };

  requestGet(url, params, callback);
};

exports.paginatedFeed = function(req, client, callback) {
  var url = req.session.url;
  req.query.since_id = null;

  if (url === '/global/feed') {
    this.globalFeed(req, callback);
  } else if (url.match(/\/user\/posts/)) {
    this.userPosts(req, client, callback);
  } else if (url.match(/\/user\/mentions/)) {
    this.userMentions(req, callback);
  } else if (url.match(/\/user\/starred/)) {
    this.userStarred(req, client, callback);
  } else if (url.match(/\/interactions/)) {
    this.userInteractions(req, callback);
  } else if (url.match(/\/feed/)) {
    this.myFeed(req, client, callback);
  } else {
    throw new Error('Could not retrieve feed');
  }
};

exports.addMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var message = req.body.text;
  var mentions = message.match(/@([A-Za-z0-9_]+)/ig);

  // Add usernames mentioned to the user's BFFs
  if (mentions) {
    for (var i = 0, l = mentions.length; i < l; i ++) {
      userDb.bffUser(user.id, mentions[i].split('@')[1], client);
    }
  }

  var qs = {
    access_token: user.access_token,
    include_annotations: 1
  };

  var jsonParams = markdownToEntities.parse(message);
  jsonParams.reply_to = req.body.reply_to || null;

  var params = {
    url: APPNET_URL + '/posts',
    qs: qs,
    json: jsonParams
  };

  requestPost(params, callback);
};

exports.deleteMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var params = {
    access_token: user.access_token
  };

  var uri = '/posts/' + postId + '?' + qs.stringify(params);

  requestDelete(uri, callback);
};

exports.repost = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var qs = {
    access_token: user.access_token
  };

  var params = {
    url: APPNET_URL + '/posts/' + postId + '/repost',
    qs: qs
  };

  requestPost(params, callback);
};

exports.unrepost = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var params = {
    access_token: user.access_token
  };

  var uri = '/posts/' + postId + '/repost?' + qs.stringify(params);

  requestDelete(uri, callback);
};

exports.starMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var qs = {
    access_token: user.access_token
  };

  var params = {
    url: APPNET_URL + '/posts/' + postId + '/star',
    form: qs,
    timeout: TIMEOUT
  };

  requestPost(params, callback);
};

exports.unstarMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var params = {
    access_token: user.access_token
  };

  var uri = '/posts/' + postId + '/star?' + qs.stringify(params);

  requestDelete(uri, callback);
};

exports.follow = function(req, client, callback) {
  var user = utils.getUser(req);
  var username = req.body.username.toLowerCase();

  var qs = {
    access_token: user.access_token
  };

  var params = {
    url: APPNET_URL + '/users/@' + username + '/follow',
    form: qs,
    timeout: TIMEOUT
  };

  requestPost(params, callback);
};

exports.unfollow = function(req, client, callback) {
  var user = utils.getUser(req);
  var username = req.body.username.toLowerCase();

  var params = {
    access_token: user.access_token
  };

  var uri = '/users/@' + username + '/follow?' + qs.stringify(params);

  requestDelete(uri, callback);
};

exports.mute = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;
  var username = req.body.username.toLowerCase();

  var qs = {
    access_token: user.access_token
  };

  var params = {
    url: APPNET_URL + '/users/' + userId + '/mute',
    form: qs,
    timeout: TIMEOUT
  };

  requestPost(params, callback);
};

exports.unmute = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;
  var username = req.body.username.toLowerCase();

  var params = {
    access_token: user.access_token
  };

  var uri = '/users/' + userId + '/mute?' + qs.stringify(params);

  requestDelete(uri, callback);
};

exports.followers = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.query.user_id || user.id;
  var url = '/users/' + userId + '/followers';

  var params = {
    access_token: user.access_token
  };

  requestGet(url, params, callback);
};

exports.following = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.query.user_id || user.id;
  var url = '/users/' + userId + '/following';

  var params = {
    access_token: user.access_token,
    count: req.body.count || null
  };

  requestGet(url, params, callback);
};

exports.thread = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/' + req.query.post_id + '/replies';

  var params = {
    access_token: user.access_token,
    include_deleted: 0,
    include_annotations: 1,
    count: THREAD_MAX
  };

  requestGet(url, params, callback);
};

exports.getTags = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/tag/' + req.query.tag;

  var params = {
    access_token: user.access_token,
    include_deleted: 0,
    include_annotations: 1
  };

  requestGet(url, params, callback);
};

exports.getPost = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/' + req.query.post_id;

  var params = {
    access_token: user.access_token,
    include_annotations: 1
  };

  requestGet(url, params, callback);
};

exports.starredUsers = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/' + req.query.post_id + '/stars';

  var params = {
    access_token: user.access_token
  };

  requestGet(url, params, callback);
};

exports.repostedUsers = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/' + req.query.post_id + '/reposters';

  var params = {
    access_token: user.access_token
  };

  requestGet(url, params, callback);
};
