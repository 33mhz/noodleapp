'use strict';

var qs = require('querystring')
var request = require('request');
var userDb = require('./user');
var utils = require('./utils');
var markdownToEntities = require('./markdown-to-entities');

var APPNET_URL = 'https://alpha-api.app.net/stream/0';

exports.userPosts = function(req, client, callback) {
  var userId = req.params.id || utils.getUserById(req);

  var params = {
    since_id: req.query.since_id,
    before_id: req.query.before_id,
    include_deleted: 0,
    include_annotations: 1
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
  var user = utils.getUser(req);
  var params = {
    access_token: user.access_token
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

exports.myFeed = function(req, client, callback) {
  var user = utils.getUser(req);
  var directedFeed = 0;

  userDb.getSettings(req, client, function(err, userItems) {
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
    }
  });
};

exports.userMentions = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.params.id || user.id;
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

exports.userStarred = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.params.id || user.id;

  var params = {
    access_token: user.access_token,
    before_id: req.query.before_id,
    include_deleted: 0,
    include_annotations: 1
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
    since_id: req.query.since_id,
    before_id: req.query.before_id,
    include_deleted: 0,
    include_annotations: 1
  };

  request.get(APPNET_URL + '/posts/stream/global?' + qs.stringify(params),
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

exports.paginatedFeed = function(req, client, callback) {
  var url = req.session.url;
  req.query.since_id = null;

  if (url === '/global/feed') {
    this.globalFeed(req, function(err, messages) {
      if (err) {
        callback(err);
      } else {
        callback(null, messages);
      }
    });
  } else if (url.match(/\/user\/posts/)) {
    this.userPosts(req, client, function(err, messages) {
      if (err) {
        callback(err);
      } else {
        callback(null, messages);
      }
    });
  } else if (url.match(/\/user\/mentions/)) {
    this.userMentions(req, function(err, messages) {
      if (err) {
        callback(err);
      } else {
        callback(null, messages);
      }
    });
  } else if (url.match(/\/user\/starred/)) {
    this.userStarred(req, client, function(err, messages) {
      if (err) {
        callback(err);
      } else {
        callback(null, messages);
      }
    });
  } else {
    // Defaults to my feed
    this.myFeed(req, client, function(err, messages) {
      if (err) {
        callback(err);
      } else {
        callback(null, messages);
      }
    });
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

  request.post(params, function(err, resp, body) {
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

exports.deleteMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var params = {
    access_token: user.access_token
  };

  request.del(APPNET_URL + '/posts/' + postId + '?' + qs.stringify(params),
    function(err, resp, body) {

    if (err) {
      callback(err);
    } else {
      try {
        userDb.unstar(user.id, postId, client);
        userDb.unrepost(user.id, postId, client);
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.repost = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var params = {
    access_token: user.access_token
  };

  request.post(APPNET_URL + '/posts/' + postId + '/repost?' + qs.stringify(params),
    function(err, resp, body) {

    if (err) {
      callback(err);
    } else {
      try {
        userDb.repost(user.id, postId, client);
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.unrepost = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var params = {
    access_token: user.access_token
  };

  request.del(APPNET_URL + '/posts/' + postId + '/repost?' + qs.stringify(params),
    function(err, resp, body) {

    if (err) {
      callback(err);
    } else {
      try {
        userDb.unrepost(user.id, postId, client);
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.starMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var qs = {
    access_token: user.access_token
  };

  var params = {
    url: APPNET_URL + '/posts/' + postId + '/star',
    form: qs
  };

  request.post(params, function(err, resp, body) {
    if (err) {
      callback(err);
    } else {
      try {
        userDb.star(user.id, postId, client);
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.unstarMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var params = {
    access_token: user.access_token
  };

  request.del(APPNET_URL + '/posts/' + postId + '/star?' + qs.stringify(params),
    function(err, resp, body) {

    if (err) {
      callback(err);
    } else {
      try {
        userDb.unstar(user.id, postId, client);
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.follow = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;
  var username = req.body.username.toLowerCase();

  var qs = {
    access_token: user.access_token
  };

  var params = {
    url: APPNET_URL + '/users/' + userId + '/follow',
    form: qs
  };

  request.post(params, function(err, resp, body) {
    if (err) {
      callback(err);
    } else {
      try {
        userDb.bffUser(user.id, username, client);
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.unfollow = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;
  var username = req.body.username.toLowerCase();

  var params = {
    access_token: user.access_token
  };

  request.del(APPNET_URL + '/users/' + userId + '/follow?' + qs.stringify(params),
    function(err, resp, body) {

    if (err) {
      callback(err);
    } else {
      try {
        userDb.unbffUser(user.id, username, client);
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
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
    form: qs
  };

  request.post(params, function(err, resp, body) {
    if (err) {
      callback(err);
    } else {
      try {
        userDb.unbffUser(user.id, username, client);
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.unmute = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;
  var username = req.body.username.toLowerCase();

  var params = {
    access_token: user.access_token
  };

  request.del(APPNET_URL + '/users/' + userId + '/mute?' + qs.stringify(params),
    function(err, resp, body) {

    if (err) {
      callback(err);
    } else {
      try {
        userDb.bffUser(user.id, username, client);
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.followers = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.query.user_id || user.id;

  var params = {
    access_token: user.access_token
  };

  request.get(APPNET_URL + '/users/' + userId + '/followers?' + qs.stringify(params),
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

exports.following = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.query.user_id || user.id;

  var params = {
    access_token: user.access_token,
    count: req.body.count || null
  };

  request.get(APPNET_URL + '/users/' + userId + '/following?' + qs.stringify(params),
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

exports.thread = function(req, callback) {
  var user = utils.getUser(req);
  var postId = req.query.post_id;

  var params = {
    access_token: user.access_token,
    include_deleted: 0,
    include_annotations: 1
  };

  request.get(APPNET_URL + '/posts/' + postId + '/replies?' + qs.stringify(params),
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

exports.getTags = function(req, callback) {
  var user = utils.getUser(req);
  var tag = req.query.tag;

  var params = {
    access_token: user.access_token,
    include_deleted: 0,
    include_annotations: 1
  };

  request.get(APPNET_URL + '/posts/tag/' + tag + '?' + qs.stringify(params),
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

exports.getPost = function(req, callback) {
  var postId = req.query.post_id;

  var params = {
    include_annotations: 1
  };

  request.get(APPNET_URL + '/posts/' + postId + '?' + qs.stringify(params),
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

exports.starredUsers = function(req, callback) {
  var user = utils.getUser(req);
  var postId = req.query.post_id;

  var params = {
    access_token: user.access_token
  };

  request.get(APPNET_URL + '/posts/' + postId + '/stars?' + qs.stringify(params),
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

exports.repostedUsers = function(req, callback) {
  var user = utils.getUser(req);
  var postId = req.query.post_id;

  var params = {
    access_token: user.access_token
  };

  request.get(APPNET_URL + '/posts/' + postId + '/reposters?' + qs.stringify(params),
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
