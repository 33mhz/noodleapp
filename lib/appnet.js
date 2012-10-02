'use strict';

var qs = require('querystring')
var request = require('request');
var userDb = require('./user');
var utils = require('./utils');

var APPNET_URL = 'https://alpha-api.app.net/stream/0';

exports.userPosts = function(req, client, callback) {
  var userId = req.params.id || utils.getUserById(req);

  var params = {
    since_id: req.query.since_id,
    before_id: req.query.before_id,
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

exports.myFeed = function(req, callback) {
  var user = utils.getUser(req);

  var params = {
    access_token: user.access_token,
    since_id: req.query.since_id,
    before_id: req.query.before_id,
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
  var user = utils.getUser(req);
  var userId = req.params.id || user.id;

  var params = {
    access_token: user.access_token,
    since_id: req.query.since_id,
    before_id: req.query.before_id,
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

exports.userStarred = function(req, client, callback) {
  var user = utils.getUser(req);
  var userId = req.params.id || user.id;

  var params = {
    access_token: user.access_token,
    since_id: req.query.since_id,
    before_id: req.query.before_id,
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
    since_id: req.query.since_id,
    before_id: req.query.before_id,
    include_deleted: 0
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
        callback(null, messages.data);
      }
    });
  } else if (url.match(/\/user\/starred/)) {
    this.userStarred(req, client, function(err, messages) {
      if (err) {
        callback(err);
      } else {
        callback(null, messages.data);
      }
    });
  } else {
    // Defaults to my feed
    this.myFeed(req, function(err, messages) {
      if (err) {
        callback(err);
      } else {
        callback(null, messages.data);
      }
    });
  }
};

exports.addMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var message = req.body.message;
  var mentions = message.match(/@([A-Za-z0-9_]+)/ig);

  // Add usernames mentioned to the user's BFFs
  for (var i = 0, l = mentions.length; i < l; i++) {
    userDb.bffUser(user.id, mentions[i].split('@')[1], client);
  }

  var qs = {
    text: message,
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

exports.deleteMessage = function(req, client, callback) {
  var user = utils.getUser(req);
  var postId = req.body.post_id;

  var params = {
    url: APPNET_URL + '/posts/' + postId + '?access_token=' + user.access_token
  };

  request.del(params, function(err, resp, body) {
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
    url: APPNET_URL + '/posts/' + postId + '/repost?access_token=' + user.access_token
  };

  request.post(params, function(err, resp, body) {
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
    url: APPNET_URL + '/posts/' + postId + '/repost?access_token=' + user.access_token
  };

  request.del(params, function(err, resp, body) {
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
    url: APPNET_URL + '/posts/' + postId + '/star?access_token=' + user.access_token,
  };

  request.del(params, function(err, resp, body) {
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

exports.follow = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;

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
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.unfollow = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;

  var params = {
    url: APPNET_URL + '/users/' + userId + '/follow?access_token=' + user.access_token,
  };

  request.del(params, function(err, resp, body) {
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

exports.mute = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;

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
        callback(null, JSON.parse(body));
      } catch(err) {
        callback(err);
      }
    }
  });
};

exports.unmute = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.body.user_id;

  var params = {
    url: APPNET_URL + '/users/' + userId + '/mute?access_token=' + user.access_token,
  };

  request.del(params, function(err, resp, body) {
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

exports.followers = function(req, callback) {
  var user = utils.getUser(req);
  var userId = req.query.user_id;

  var params = {
    url: APPNET_URL + '/users/' + userId + '/followers?access_token=' + user.access_token,
  };

  request.get(params, function(err, resp, body) {
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
  var userId = req.query.user_id;

  var params = {
    url: APPNET_URL + '/users/' + userId + '/following?access_token=' + user.access_token,
  };

  request.get(params, function(err, resp, body) {
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
    include_deleted: 0
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
    include_deleted: 0
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

  request.get(APPNET_URL + '/posts/' + postId,
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

  request.get(APPNET_URL + '/posts/' + postId + '/stars?access_token=' + user.access_token,
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

  request.get(APPNET_URL + '/posts/' + postId + '/reposters?access_token=' + user.access_token,
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
