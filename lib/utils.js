'use strict';

/* API check from current <-> legacy */
exports.getUser = function(req) {
  if (req.session.passport.user._json && req.session.passport.user._json.data) {
    return req.session.passport.user._json.data;
  } else {
    return req.session.passport.user;
  }
};

exports.getUserById = function(req) {
  if (req.session.passport.user._json && req.session.passport.user._json.data) {
    return req.session.passport.user._json.data.id;
  } else {
    return req.session.passport.user.id;
  }
};

/* Generate the feed content
 * Requires: recentMessages
 * Returns: the messages as JSON
 */
exports.generateFeed = function(req, recentMessages, client, paginated, callback) {
  var webremix = require('./web-remix');
  var userDb = require('./user');
  var newMessages = [];
  var messageCount = 0;
  var userSession = this.getUser(req);
  var userId = userSession.id;
  var username = userSession.username;
  var metadata = false;

  if (recentMessages.meta) {
    metadata = recentMessages.meta;
  }

  if (recentMessages.data) {
    recentMessages = recentMessages.data;
  }

  if (recentMessages.length > 0) {
    recentMessages.forEach(function(recent) {
      if (recent.text) {
        messageCount ++;
        var messageData = {};

        webremix.generate(recent.text, function(errMsg, message) {
          if (!errMsg) {
            var isSelf = false;
            var isThread = false;
            var isStarred = false;
            var user = recent.user;

            /* maxId is used for starred posts, since they can't be paginated
             * by their post_id - reason is that posts can be starred in any
             * order and therefore have their own id system on app.net for sorting.
             */
            var minId = null;

            if (metadata && metadata.min_id) {
              minId = metadata.min_id;
            }

            if (user.id === userId) {
              isSelf = true;
            }

            if (recent.reply_to) {
              isThread = true;
            }

            userDb.isStarred(userId, recent.id, client, function(err, starred) {
              var userReferences = ['@' + user.username];
              var userMentions = recent.entities.mentions;

              userMentions.forEach(function(user) {
                if (userReferences.indexOf('@' + user.name) === -1) {
                  userReferences.push('@' + user.name);
                }
              });

              userReferences.splice(userReferences.indexOf('@' + user.username), 1);
              if (userReferences.indexOf('@' + username) > -1) {
                userReferences.splice(userReferences.indexOf('@' + username), 1);
              }

              if (recent.you_starred || starred) {
                userDb.star(userId, recent.id, client);
                isStarred = true;
              } else {
                userDb.unstar(userId, recent.id, client);
              }

              userDb.isReposted(userId, recent.id, client, function(err, reposted) {
                var isRepost = false;

                if (recent.you_reposted || reposted) {
                  userDb.repost(userId, recent.id, client);
                  isRepost = true;
                } else {
                  userDb.unrepost(userId, recent.id, client);
                }

                messageData = {
                  id: recent.id,
                  created_at: recent.created_at,
                  message: message,
                  user: user.avatar_image.url,
                  name: user.name,
                  user_id: user.id,
                  username: user.username,
                  isSelf: isSelf,
                  isThread: isThread,
                  isStarred: isStarred,
                  isRepost: isRepost,
                  isFollowing: user.you_follow,
                  isMuted: user.you_muted,
                  numStars: recent.num_stars,
                  numReposts: recent.num_reposts,
                  numReplies: recent.num_replies,
                  appSource: recent.source.name,
                  mentions: userReferences.join(' '),
                  min_id: minId
                };

                newMessages.push(messageData);

                if (newMessages.length === messageCount || messageCount === 1) {
                  if (!paginated) {
                    newMessages = newMessages.sort(function(a, b) {
                      return parseInt(a.id, 10) - parseInt(b.id, 10);
                    });
                  }

                  callback(newMessages);
                }
              });
            });
          }
        });
      }
    });
  } else {
    callback(newMessages);
  }
};
