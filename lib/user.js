'use strict';

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

/* Save each user's favorite usernames (the ones they @ mention) */
exports.bffUser = function(userId, username, client) {
  client.sadd('userBFFs:' +  userId, username);
};

exports.unbffUser = function(userId, username, client) {
  client.srem('userBFFs:' +  userId, username);
};

exports.bffs = function(userId, client, callback) {
  client.smembers('userBFFs:' +  userId, callback);
};
