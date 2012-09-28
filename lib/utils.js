'use strict';

/* Generate the feed content
 * Requires: recentMessages
 * Returns: the messages as JSON
 */
exports.generateFeed = function(recentMessages, userId, client, paginated, callback) {
  var webremix = require('./web-remix');
  var userDb = require('./user');
  var newMessages = [];
  var messageCount = 0;

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

            if (recent.user.id === userId) {
              isSelf = true;
            }

            if (recent.reply_to) {
              isThread = true;
            }

            userDb.isStarred(userId, recent.id, client, function(err, starred) {
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
                  user: recent.user.avatar_image.url,
                  name: recent.user.name,
                  user_id: recent.user.id,
                  username: recent.user.username,
                  isSelf: isSelf,
                  isThread: isThread,
                  isStarred: isStarred,
                  isRepost: isRepost,
                  isFollowing: recent.user.you_follow,
                  isMuted: recent.user.you_muted,
                  numStars: recent.num_stars,
                  numReposts: recent.num_reposts,
                  numReplies: recent.num_replies,
                  appSource: recent.source.name
                };

                newMessages.push(messageData);

                if (newMessages.length === recentMessages.length || recentMessages.length === 1) {
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
