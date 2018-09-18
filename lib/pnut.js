'use strict';

var qs = require('querystring');
var request = require('request');
var userDb = require('./user');
var utils = require('./utils');

var PNUT_URL = 'https://api.pnut.io/v0';
var TIMEOUT = 20000;
var THREAD_MAX = 200;

var requestGet = function(url, params, callback) {
  if (!params.count) params.count = 20;
  request.get({ uri: PNUT_URL + url + '?' + qs.stringify(params), timeout: TIMEOUT },
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
      if (body.meta && body.meta.code) {
        if (body.meta.code === 201) {
          callback(null, body);
        } else {
          callback(new Error('Could not post message'));
        }
      } else {
        callback(null, body);
      }
    }
  });
};

var requestPut = function(params, callback) {
  request.put(params, function(err, resp, body) {
    if (err) {
      callback(err);
    } else {
      if (body.meta && body.meta.code) {
        if (body.meta.code === 200) {
          callback(null, body);
        } else {
          callback(new Error(body.meta.error_message));
        }
      } else {
        callback(null, body);
      }
    }
  });
};

var requestDelete = function(uri, callback) {
  request.del({ uri: PNUT_URL + uri, timeout: TIMEOUT },
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
    include_post_raw: 1
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
  var url = '/users/me';

  var params = {
    url: PNUT_URL + url,
    qs: {
      access_token: user.access_token
    },
    json: userInfo
  };

  requestPut(params, callback);
};

exports.myFeed = function(req, client, callback) {
  var user = utils.getUser(req);
  var url = '/posts/streams/';
  var directedFeed = 0;
  var unifiedFeed = 'me';

  userDb.getLocalSettings(req, client, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      if (userItems.directedFeed === 'true') {
        directedFeed = 1;
      }
      if (userItems.unifiedFeed === 'true') {
        unifiedFeed = 'unified';
      }

      var params = {
        access_token: user.access_token,
        since_id: req.query.since_id,
        before_id: req.query.before_id,
        include_deleted: 0,
        include_directed_posts: directedFeed,
        include_post_raw: 1
      };

      requestGet(url + unifiedFeed, params, callback);
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
    include_post_raw: 1
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
    filters: 'bookmark,repost,follow',
    include_deleted: 0,
    count: count,
    include_post_raw: 1
  };

  requestGet(url, params, callback);
};

exports.userStarred = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.params.id || user.id;
  var url = '/users/' + userId + '/bookmarks';

  var params = {
    access_token: user.access_token,
    before_id: req.query.before_id,
    include_deleted: 0,
    include_post_raw: 1
  };

  requestGet(url, params, callback);
};

exports.globalFeed = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/streams/global';

  var params = {
    access_token: user.access_token,
    since_id: req.query.since_id,
    before_id: req.query.before_id,
    include_deleted: 0,
    include_post_raw: 1
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
  var mentions = message.match(/@([a-z0-9_]+)/ig);

  // Add usernames mentioned to the user's BFFs
  if (mentions) {
    for (var i = 0, l = mentions.length; i < l; i ++) {
      userDb.bffUser(user.id, mentions[i].split('@')[1], client);
    }
  }

  var qs = {
    access_token: user.access_token,
    include_message_raw: 1
  };

  var jsonParams = {text:message};
  jsonParams.reply_to = req.body.reply_to || null;

  var params = {
    url: PNUT_URL + '/posts',
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

  var params = {
    access_token: user.access_token
  };

  var uri = PNUT_URL + '/posts/' + postId + '/repost?' + qs.stringify(params);

  requestPut(uri, callback);
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

  var params = {
    access_token: user.access_token
  };

  var uri = PNUT_URL + '/posts/' + postId + '/bookmark?' + qs.stringify(params);

  requestPut(uri, callback);
};

exports.unstarMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var params = {
    access_token: user.access_token
  };

  var uri = '/posts/' + postId + '/bookmark?' + qs.stringify(params);

  requestDelete(uri, callback);
};

exports.follow = function(req, client, callback) {
  var user = utils.getUser(req);
  var username = req.body.username;

  var params = {
    access_token: user.access_token
  };

  var uri = PNUT_URL + '/users/@' + username + '/follow?' + qs.stringify(params);

  requestPut(uri, callback);
};

exports.unfollow = function(req, client, callback) {
  var user = utils.getUser(req);
  var username = req.body.username;

  var params = {
    access_token: user.access_token
  };

  var uri = '/users/@' + username + '/follow?' + qs.stringify(params);

  requestDelete(uri, callback);
};

exports.mute = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;

  var params = {
    access_token: user.access_token
  };

  var uri = PNUT_URL + '/users/' + userId + '/mute?' + qs.stringify(params);

  requestPut(uri, callback);
};

exports.unmute = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;

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
    access_token: user.access_token,
    count: req.body.count || '200'
  };

  requestGet(url, params, callback);
};

exports.following = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.query.user_id || user.id;
  var url = '/users/' + userId + '/following';

  var params = {
    access_token: user.access_token,
    count: req.body.count || '200'
  };

  requestGet(url, params, callback);
};

exports.muted = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.query.user_id || user.id;
  var url = '/users/' + userId + '/muted';

  var params = {
    access_token: user.access_token,
    count: req.body.count || '200'
  };

  requestGet(url, params, callback);
};

exports.blocked = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.query.user_id || user.id;
  var url = '/users/' + userId + '/blocked';

  var params = {
    access_token: user.access_token,
    count: req.body.count || '200'
   };
};

exports.thread = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/' + req.query.post_id + '/thread';

  var params = {
    access_token: user.access_token,
    include_deleted: 0,
    include_post_raw: 1,
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
    include_post_raw: 1
  };

  requestGet(url, params, callback);
};

exports.getPost = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/' + req.query.post_id;

  var params = {
    access_token: user.access_token,
    include_post_raw: 1
  };

  requestGet(url, params, callback);
};

exports.starredUsers = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/' + req.query.post_id + '/actions?filters=bookmark';

  var params = {
    access_token: user.access_token
  };

  requestGet(url, params, callback);
};

exports.repostedUsers = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/posts/' + req.query.post_id + '/actions?filters=repost';

  var params = {
    access_token: user.access_token
  };

  requestGet(url, params, callback);
};

exports.getChannels = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/users/me/channels/subscribed';

  var params = {
    access_token: user.access_token
  };

  requestGet(url, params, callback);
};

exports.getMessages = function(req, callback) {
  var user = utils.getUser(req);
  var url = '/channels/' + parseInt(req.params.id, 10) + '/messages';

  var params = {
    access_token: user.access_token,
    include_deleted: '0'
  };

  requestGet(url, params, callback);
};

exports.postChannelMessage = function(req, callback) {
  var user = utils.getUser(req);
  var message = req.body.text;

  var users = req.body.destinations.trim().split(' ');

  var userArr = [];

  for (var i = 0; i < users.length; i ++) {
    if (users[i].length > 0) {
      userArr.push(users[i]);
    }
  }

  var qs = {
    access_token: user.access_token,
    include_post_raw: 1,
    update_marker: 1
  };

  var url;
  var jsonParams = {text:message};

  if (userArr.length < 1) {
    url = '/channels/' + req.body.channel_id + '/messages';
  } else {
    jsonParams.destinations = userArr;
    url = '/channels/pm/messages';
  }

  var params = {
    url: PNUT_URL + url,
    qs: qs,
    json: jsonParams
  };

  requestPost(params, callback);
};
