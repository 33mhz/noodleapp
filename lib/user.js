'use strict';

var utils = require('./utils');

/* We need to save the starred/repost status on users in our database, since
 * the API call to user posts on app.net's end is only an unauthenticated
 * request.
 * Unauthenticated requests do not return a flag of whether you starred/reposted a
 * post or not. Therefore, we just do it locally.
 */
exports.star = function(userId, postId, client) {
  client.sadd('userStarred:' +  userId, postId);
};

exports.unstar = function(userId, postId, client) {
  client.srem('userStarred:' +  userId, postId);
};

exports.isStarred = function(userId, postId, client, callback) {
  client.sismember('userStarred:' +  userId, postId, function(err, result) {
    if (err) {
      callback(null, false);
    } else {
      if (result) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  });
};

exports.repost = function(userId, postId, client) {
  client.sadd('userReposted:' +  userId, postId);
};

exports.unrepost = function(userId, postId, client) {
  client.srem('userReposted:' +  userId, postId);
};

exports.isReposted = function(userId, postId, client, callback) {
  client.sismember('userReposted:' +  userId, postId, function(err, result) {
    if (err) {
      callback(null, false);
    } else {
      if (result) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  });
};

exports.bffUser = function(userId, username, client) {
  client.sadd('userBFFs:' +  userId, username);
};

exports.unbffUser = function(userId, username, client) {
  client.srem('userBFFs:' +  userId, username);
};

exports.bffs = function(userId, client, callback) {
  client.smembers('userBFFs:' +  userId, callback);
  client.expire('userBFFs:' +  userId, 60 * 60 * 24 * 3) // 3 days
};

exports.getSettings = function(req, client, callback) {
  var userId = utils.getUserById(req);

  client.hgetall('settings:' + userId, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      if (!userItems) {
        // Nothing has been set for the user yet, so make a new default
        userItems = {
          directedFeed: 'false',
          mediaOn: 'true'
        }
      }
      callback(null, userItems);
    }
  });
};

exports.saveSettings = function(req, client, callback) {
  var userId = utils.getUserById(req);
  var directedFeed = false;
  var mediaOn = false;
  var charLimit = false;

  if (req.body.directed_feed === 'true') {
    directedFeed = true;
  }

  if (req.body.media_on === 'true') {
    mediaOn = true;
  }

  if (req.body.char_limit === 'true') {
    charLimit = true;
  }

  client.hset('settings:' + userId, 'directedFeed', directedFeed);
  client.hset('settings:' + userId, 'mediaOn', mediaOn);
  client.hset('settings:' + userId, 'charLimit', charLimit);

  this.getSettings(req, client, function(err, userItems) {
    if (err) {
      callback(err);
    } else {
      callback(null, userItems);
    }
  });
};
