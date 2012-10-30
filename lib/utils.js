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
  var messageData = {};

  var createClientMessage = function(options, callback) {
    /* maxId is used for starred posts, since they can't be paginated
     * by their post_id - reason is that posts can be starred in any
     * order and therefore have their own id system on app.net for sorting.
     */
    var minId = null;
    var isSelf = false;
    var isStarred = false;
    var isThread = false;

    if (options.metadata && options.metadata.min_id) {
      minId = options.metadata.min_id;
    }

    if (options.user.id === userId) {
      isSelf = true;
    }

    if (options.recent.reply_to) {
      isThread = true;
    }

    // We want to preserve the line breaks if there are any
    var message = options.tokenized.join('').replace(/\n/, '<br>');

    // Annotations
    message += options.moods + options.photos;

    userDb.isStarred(userId, options.recent.id, client, function(err, starred) {
      var userReferences = ['@' + options.user.username];
      var reply_to = null;

      options.userMentions.forEach(function(user) {
        if (userReferences.indexOf('@' + user.name) === -1) {
          userReferences.push('@' + user.name);
        }
      });

      userReferences.splice(userReferences.indexOf('@' + options.user.username), 1);
      if (userReferences.indexOf('@' + options.user.username) > -1) {
        userReferences.splice(userReferences.indexOf('@' + options.user.username), 1);
      }

      if (options.recent.you_starred || starred) {
        userDb.star(userId, options.recent.id, client);
        isStarred = true;
      } else {
        userDb.unstar(userId, options.recent.id, client);
      }

      userDb.isReposted(userId, options.recent.id, client, function(err, reposted) {
        var isRepost = false;

        if (options.recent.you_reposted || reposted) {
          userDb.repost(userId, options.recent.id, client);
          isRepost = true;
        } else {
          userDb.unrepost(userId, options.recent.id, client);
        }

        if (options.recent.repost_of) {
          reply_to = options.recent.repost_of.id;
        }

        messageData = {
          id: options.recent.id,
          created_at: options.recent.created_at,
          message: message,
          text: options.recent.text,
          user: options.user.avatar_image.url,
          name: options.user.name,
          user_id: options.user.id,
          username: options.user.username,
          isSelf: isSelf,
          isThread: isThread,
          isStarred: isStarred,
          isRepost: isRepost,
          isFollowing: options.user.you_follow,
          isMuted: options.user.you_muted,
          numStars: options.recent.num_stars,
          numReposts: options.recent.num_reposts,
          numReplies: options.recent.num_replies,
          appSource: options.recent.source.name,
          mentions: userReferences.join(' '),
          min_id: minId,
          reply_to: reply_to
        };

        newMessages.push(messageData);

        if (newMessages.length === recentMessages.length) {
          if (!options.paginated) {
            newMessages = newMessages.sort(function(a, b) {
              return parseInt(a.id, 10) - parseInt(b.id, 10);
            });
          }
          callback(newMessages);
        }
      });
    });
  };

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

        var user = recent.user;
        var moods = '';
        var photos = '';

        // Annotations
        var moodArray = ['happy', 'sad', 'tired', 'angry', 'calm', 'omg'];

        recent.annotations.forEach(function(annotation) {
          if (annotation.type === 'net.xtendr.mood' && moodArray.indexOf(annotation.value.mood) > -1) {
            var mood = '<img src="/images/emoticons/' + annotation.value.mood + '.png" class="mood" alt="' +
              annotation.value.mood + '" title="' + annotation.value.mood + '">';

            moods += mood;

          } else if (annotation.type === 'net.app.core.oembed') {
            if (annotation.value.type === 'photo') {
              var photo = '<div class="image-wrapper"><a href="' + annotation.value.canonical_url +
                '" target="_blank"><img src="' + annotation.value.url + '" alt="" title=""></div>' +
                '<a href="' + annotation.value.canonical_url + '" target="_blank" class="media-off">' +
                annotation.value.canonical_url + '</a>';

              photos += photo;
            }
          }
        });

        var entities = [];

        // Mentions
        var userMentions = recent.entities.mentions;
        recent.entities.mentions.forEach(function(mention) {
          var name = recent.text.substr(mention.pos, mention.len);
          entities.push({
            pos: mention.pos,
            len: mention.len,
            html: '<a href="/user/' + name.substr(1) + '/">' + name + '</a>'
          });
        });

        // Hashtags
        recent.entities.hashtags.forEach(function(hashtag) {
          var name = recent.text.substr(hashtag.pos, hashtag.len);
          entities.push({
            pos: hashtag.pos,
            len: hashtag.len,
            html: '<a href="/tagged/' + name.substr(1) + '/" class="tags">' + name + '</a>'
          });
        });

        var continueRendering = function() {
          entities.sort(function(entity1, entity2) {
            return entity1.pos - entity2.pos;
          });

          var htmlMessages = [];
          var textIdx = 0;
          entities.forEach(function(entity) {
            // Before entity
            htmlMessages.push(recent.text.substring(textIdx, entity.pos));

            htmlMessages.push(entity.html);
            textIdx = entity.pos + entity.len;
          });
          // After last entity
          htmlMessages.push(recent.text.substring(textIdx));

          var options = {
            recent: recent,
            tokenized: htmlMessages,
            user: user,
            userMentions: userMentions,
            messageCount: messageCount,
            metadata: metadata,
            moods: moods,
            photos: photos,
            paginated: paginated
          };

          createClientMessage(options, callback);
        };

        var processLink = function(idx) {
          var link = recent.entities.links[idx];
          webremix.generate(link, client, function(errMsg, message) {
            if (!errMsg) {
              entities.push({
                pos: link.pos,
                len: link.len,
                html: message
              });
            }

            if (idx === recent.entities.links.length - 1) {
              continueRendering();
            } else {
              processLink(idx + 1);
            }
          });
        };

        if (recent.entities.links.length > 0) {
          processLink(0);
        }
        else {
          continueRendering();
        }
      }
    });
  } else {
    callback(newMessages);
  }
};
