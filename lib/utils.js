'use strict';

var request = require('request');

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
 * Requires: web request, recentMessages, redis client, pagination boolean, callback
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
      if (recent.data) {
        recent = recent.data;
      }

      if (recent.text) {
        messageCount ++;
        var messageData = {};
        var isSelf = false;
        var isThread = false;
        var isStarred = false;
        var user = recent.user;
        var moods = [];
        var photos = [];

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

        // Annotations
        recent.annotations.forEach(function(annotation) {
          if (annotation.type === 'net.xtendr.mood') {
            moods.push(annotation.value.mood);
          } else if (annotation.type === 'net.app.core.oembed') {
            if (annotation.value.type === 'photo') {
              var photo = {
                url: annotation.value.url,
                embedUrl: annotation.value.canonical_url
              };
              photos.push(photo);
            }
          }
        });

        var tokenized = recent.text.split('');

        // Mentions
        var userMentions = recent.entities.mentions;
        recent.entities.mentions.forEach(function(mention) {
          tokenized[mention.pos] = '<a href="/user/' + mention.name + '/">@' + mention.name + '</a>';
          for (var i = mention.pos + 1; i < mention.pos + mention.len; i ++) {
            tokenized[i] = '';
          }
        });

        // Hashtags
        var hashtagsPos = [];
        recent.entities.hashtags.forEach(function(hashtag) {
          tokenized[hashtag.pos] = '<a href="/tagged/' + hashtag.name + '/" class="tags">#' + hashtag.name + '</a>';
          for (var i = hashtag.pos + 1; i < hashtag.pos + hashtag.len; i ++) {
            tokenized[i] = '';
          }
        });

        // Entities
        var links = recent.entities.links;
        var linksPos = [];
        recent.entities.links.forEach(function(link) {
          webremix.generate(link, client, function(errMsg, message) {
            if (!errMsg) {
              tokenized[link.pos] = message;
              for (var i = link.pos + 1; i < link.pos + link.len; i ++) {
                tokenized[i] = '';
              }
            }
          });
        });

        userDb.isStarred(userId, recent.id, client, function(err, starred) {
          var userReferences = ['@' + user.username];
          var reply_to = null;

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

            if (recent.repost_of) {
              reply_to = recent.repost_of.id;
            }

            messageData = {
              id: recent.id,
              created_at: recent.created_at,
              message: tokenized.join(''),
              text: recent.text,
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
              min_id: minId,
              reply_to: reply_to,
              moods: moods,
              photos: photos,
              links: links
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
  } else {
    callback(newMessages);
  }
};
