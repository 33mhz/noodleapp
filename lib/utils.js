'use strict';

var request = require('request');
var webremix = require('./web-remix');
var userDb = require('./user');

var escapeHtml = function(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/* API check from current <-> legacy */
exports.getUser = function(req) {
  if (req.session.passport.user._json && req.session.passport.user._json.data) {
    return req.session.passport.user._json.data;
  } else {
    return req.session.passport.user;
  }
};

exports.getUserId = function(req) {
  if (req.session.passport.user._json && req.session.passport.user._json.data) {
    return req.session.passport.user._json.data.id;
  } else {
    return req.session.passport.user.id;
  }
};

var createClientMessage = function(client, options, callback) {
  process.nextTick(function() {
    /* maxId is used for starred posts, since they can't be paginated
     * by their post_id - reason is that posts can be starred in any
     * order and therefore have their own id system on app.net for sorting.
     */
    var minId = null;
    var isSelf = false;
    var isThread = false;
    var repostId = null;

    if (options.metadata && options.metadata.min_id) {
      minId = options.metadata.min_id;
    }

    if (options.user.id === options.userId) {
      isSelf = true;
    }

    if (options.recent.reply_to) {
      isThread = true;
    }

    if (options.recent.repost_of) {
      repostId = options.recent.repost_of.id;
    }

    // We want to preserve the line breaks if there are any
    var message = options.tokenized.join('').replace(/\n/, '<br>');

    // Annotations
    message += options.moods + options.photos;

    var userReferences = {};
    var replyTo = null;

    userReferences['@' + options.user.username] = '@' + options.user.username;

    options.userMentions.forEach(function(user) {
      userReferences['@' + user.name] = '@' + user.name;
    });

    delete userReferences['@' + options.username];
    delete userReferences['@' + options.user.username];

    if (options.recent.repost_of) {
      replyTo = options.recent.repost_of.id;
    }

    var userReferenceArr = [];

    for (var username in userReferences) {
      userReferenceArr.push(username);
    }

    var messageData = {
      id: options.recent.id,
      createdAt: options.recent.created_at,
      message: message,
      text: options.recent.text,
      user: options.user.avatar_image.url,
      name: options.user.name,
      userId: options.user.id,
      username: options.user.username,
      isSelf: isSelf,
      isThread: isThread,
      isStarred: options.recent.you_starred,
      isRepost: options.recent.you_reposted,
      repostId: repostId,
      isFollowing: options.user.you_follow,
      isMuted: options.user.you_muted,
      numStars: options.recent.num_stars,
      numReposts: options.recent.num_reposts,
      numReplies: options.recent.num_replies,
      appSource: options.recent.source.name,
      mentions: userReferenceArr.join(' '),
      minId: minId,
      replyTo: replyTo,
      inReplyToId: options.recent.reply_to
    };

    options.newMessages.push(messageData);

    if (options.newMessages.length === options.recentMessagesLength) {
      if (!options.paginated) {
        options.newMessages = options.newMessages.sort(function(a, b) {
          return parseInt(a.id, 10) - parseInt(b.id, 10);
        });
      }

      callback(options.newMessages);
    }
  });
};

var continueRendering = function(entities, client, options, callback) {
  process.nextTick(function() {
    var htmlMessages = [];
    var textIdx = 0;

    entities.sort(function(entity1, entity2) {
      return entity1.pos - entity2.pos;
    });

    entities.forEach(function(entity) {
      // Before entity
      htmlMessages.push(escapeHtml(options.recent.text.substring(textIdx, entity.pos)));

      htmlMessages.push(entity.html);
      textIdx = entity.pos + entity.len;
    });
    // After last entity
    htmlMessages.push(escapeHtml(options.recent.text.substring(textIdx)));

    options.tokenized = htmlMessages;
    createClientMessage(client, options, callback);
  });
};

var processLink = function(idx, entities, client, options, callback) {
  var link = options.recent.entities.links[idx];

  webremix.generate(link, client, function(errMsg, message) {
    if (!errMsg) {
      entities.push({
        pos: link.pos,
        len: link.len,
        html: message
      });
    }

    if (idx === options.recent.entities.links.length - 1) {
      continueRendering(entities, client, options, callback);
    } else {
      processLink(idx + 1, entities, client, options, callback);
    }
  });
};

/* Generate the feed content
 * Requires: web request, recentMessages, redis client, pagination boolean, callback
 * Returns: the messages as JSON
 */
exports.generateFeed = function(req, recentMessages, client, paginated, callback) {
  var self = this;

  process.nextTick(function() {
    var newMessages = [];
    var messageCount = 0;
    var userSession = self.getUser(req);
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
      for (var i = 0; i < recentMessages.length; i ++) {
        var recent = recentMessages[i];
        if (recent.data) {
          recent = recent.data;
        }

        if (recent.text) {
          messageCount ++;

          var user = recent.user;
          var moods = '';
          var photos = '';
          var entities = [];
          var userMentions = recent.entities.mentions;

          // Annotations
          var moodArray = ['happy', 'sad', 'tired', 'angry', 'calm', 'omg'];

          recent.annotations.forEach(function(annotation) {
            if (annotation.type === 'net.xtendr.mood' && moodArray.indexOf(annotation.value.mood) > -1) {
              var mood = '<img src="/images/emoticons/' + annotation.value.mood + '.png" class="mood" alt="' +
                annotation.value.mood + '" title="' + annotation.value.mood + '">';

              moods += mood;

            } else if (annotation.type === 'net.app.core.oembed') {

              if (annotation.value.type === 'photo' &&
                !annotation.value.url.match(/((http|https):\/\/)?(\S)+\.(jpg|jpeg|png|gif)($|(#|\?))/gi)) {
                var linkUrl = annotation.value.embeddable_url || annotation.value.url;
                var photo = '<div class="image-wrapper"><a href="' + linkUrl +
                  '" target="_blank"><img src="' + annotation.value.url + '" alt="" title=""></div>' +
                  '<a href="' + linkUrl + '" target="_blank" class="media-off">' +
                  linkUrl + '</a>';

                photos += photo;
              }
            }
          });

          // Mentions
          userMentions.forEach(function(mention) {
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
              html: '<a href="/#/tagged/' + name.substr(1) + '/" class="tags">' + name + '</a>'
            });
          });

          var options = {
            recent: recent,
            newMessages: newMessages,
            recentMessagesLength: recentMessages.length,
            user: user,
            userId: userId,
            username: username,
            userMentions: userMentions,
            messageCount: messageCount,
            metadata: metadata,
            moods: moods,
            photos: photos,
            paginated: paginated
          };

          if (recent.entities.links.length > 0) {
            processLink(0, entities, client, options, callback);
          } else {
            continueRendering(entities, client, options, callback);
          }
        }
      }
    } else {
      callback(newMessages);
    }
  });
};

/* Generate the interaction content
 * Requires: web request, recentMessages, redis client, pagination boolean, callback
 * Returns: the messages as JSON
 */
exports.generateInteractions = function(req, recentMessages, client, paginated, callback) {
  var newMessages = [];
  var recentList = recentMessages.data;
  var userSession = this.getUser(req);
  var username = userSession.username;
  var messageCount = 0;

  if (recentList.length > 0) {
    recentList.forEach(function(recent) {
      var messageItem = recent.objects[0];
      var message = '';
      var icon = '';

      var users = [];
      recent.users.forEach(function(user) {
        users.push(user);
      });

      if (recent.action === 'reply') {
        message = 'Replied to <a href="/#/post/' + messageItem.id + '/' + username + '">your post</a>';
        icon = '<span class="action-icon reply"></span>';
      } else if (recent.action === 'follow') {
        message = 'Followed you';
        icon = '<span class="action-icon follow"></span>';
      } else if (recent.action === 'star') {
        message = 'Starred <a href="/#/post/' + messageItem.id + '/' + username + '">your post</a>';
        icon = '<span class="action-icon star"></span>';
      } else if (recent.action === 'repost') {
        message = 'Reposted <a href="/#/post/' + messageItem.id + '/' + username + '">your post</a>';
        icon = '<span class="action-icon repost"></span>';
      }

      var options = {
        id: messageItem.id,
        users: users,
        message: message,
        minId: recentMessages.meta.min_id,
        icon: icon
      };

      newMessages.push(options);

      newMessages = newMessages.sort(function(a, b) {
        return parseInt(a.id, 10) - parseInt(b.id, 10);
      });

      if (newMessages.length === recentList.length) {
        callback(newMessages)
      }
    });
  } else {
    callback(newMessages);
  }
};
