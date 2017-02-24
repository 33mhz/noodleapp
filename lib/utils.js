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

var createClientMessage = function(options, callback) {
  process.nextTick(function() {
    /* maxId is used for starred posts, since they can't be paginated
     * by their post_id - reason is that posts can be starred in any
     * order and therefore have their own id system on pnut.io for sorting.
     */
    var minId = null;
    var isSelf = false;
    var isThread = false;
    var repostDetails = { id: null };

    if (options.recent.repostDetails) {
      repostDetails = options.recent.repostDetails;
    }
    
    if (options.metadata && options.metadata.min_id) {
      minId = options.metadata.min_id;
    }

    if (options.user.id === options.userId) {
      isSelf = true;
    }

    if (options.recent.reply_to || options.recent.counts.replies) {
      isThread = true;
    }

    // We want to preserve the line breaks if there are any
    var message = options.tokenized.join('').replace(/\n/, '<br>');

    // Annotations
    message += options.moods + options.photos;

    var userReferences = {};
    var replyTo = null;

    userReferences['@' + options.user.username] = '@' + options.user.username;

    options.userMentions.forEach(function(user) {
      userReferences['@' + user.text] = '@' + user.text;
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
      crosspost: options.crosspost,
      message: message,
      text: options.recent.content.text,
      user: options.user.content.avatar_image.link,
      name: options.user.name,
      userId: options.user.id,
      username: options.user.username,
      isSelf: isSelf,
      isThread: isThread,
      isStarred: options.recent.you_bookmarked,
      isRepost: options.recent.you_reposted,
      repostDetails: repostDetails,
      isFollowing: options.user.you_follow,
      isMuted: options.user.you_muted,
      numStars: options.recent.counts.bookmarks,
      numReposts: options.recent.counts.reposts,
      numReplies: options.recent.counts.replies,
      appSource: options.recent.source.name,
      appSourceUrl: options.recent.source.link,
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

var continueRendering = function(entities, options, callback) {
  process.nextTick(function() {
    var htmlMessages = [];
    var textIdx = 0;

    entities.sort(function(entity1, entity2) {
      return entity1.pos - entity2.pos;
    });

    entities.forEach(function(entity) {
      // Before entity
      htmlMessages.push(escapeHtml(options.recent.content.text.substring(textIdx, entity.pos)));

      htmlMessages.push(entity.html);
      textIdx = entity.pos + entity.len;
    });
    // After last entity
    htmlMessages.push(escapeHtml(options.recent.content.text.substring(textIdx)));

    options.tokenized = htmlMessages;
    createClientMessage(options, callback);
  });
};

var processLink = function(idx, entities, options, callback) {
  var link = options.recent.content.entities.links[idx];

  var media = webremix.generate(link);

  entities.push({
    pos: link.pos,
    len: link.len,
    html: media
  });

  if (idx === options.recent.content.entities.links.length - 1) {
    continueRendering(entities, options, callback);
  } else {
    processLink(idx + 1, entities, options, callback);
  }
};

/* Generate the feed content
 * Requires: web request, recentMessages, redis client, pagination boolean, callback
 * Returns: the messages as JSON
 */
exports.generateFeed = function(req, recentMessages, paginated, callback) {
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

        if (typeof recent.is_deleted !== 'undefined') {
          messageCount ++;
          recent.content = {text:''};
            
          var options = {
            crosspost: '',
            recent: recent,
            newMessages: newMessages,
            recentMessagesLength: recentMessages.length,
            user: recent.user,
            userId: userId,
            username: username,
            userMentions: [],
            messageCount: messageCount,
            metadata: metadata,
            moods: '',
            photos: '',
            paginated: paginated
          };

          continueRendering([], options, callback);
        } else if (typeof recent.content !== 'undefined') {
          messageCount ++;

          if (recent.repost_of) {
            var repost = recent;
            recent = recent.repost_of;
            recent.repostDetails = { id: repost.id, user_id: repost.user.id, username: repost.user.username, avatar: repost.user.content.avatar_image.link };
          }
          
          var user = recent.user;
          var moods = '';
          var photos = '';
          var entities = [];
          var crosspost = '';
          var userMentions = recent.content.entities.mentions;

          // raw
          var moodArray = ['happy', 'sad', 'tired', 'angry', 'calm', 'omg'];
          
          if (recent.raw) {
            recent.raw.forEach(function(annotation) {
              if (annotation.type === 'net.xtendr.mood' && moodArray.indexOf(annotation.value.mood) > -1) {
                var mood = '<img src="/images/emoticons/' + annotation.value.mood + '.png" class="mood" alt="' +
                  annotation.value.mood + '" title="' + annotation.value.mood + '">';

                moods += mood;

              } else if (annotation.type === 'io.pnut.core.oembed') {
                if (annotation.value.type === 'photo' &&
                  recent.content.text.indexOf(annotation.value.url) === -1) {
                  var linkUrl = annotation.value.embeddable_url || annotation.value.url;
                  var photo = '<div class="image-wrapper"><a href="' + linkUrl +
                    '" target="_blank"><img src="' + annotation.value.url + '" alt="" title=""></div>' +
                    '<a href="' + linkUrl + '" target="_blank" class="media-off">' +
                    linkUrl + '</a>';

                  photos += photo;
                }
              } else if (annotation.type === 'io.pnut.core.crosspost') {
                crosspost = annotation.value.canonical_url;
              } else if (annotation.type === 'nl.chimpnut.blog.post') {
                recent.content.text += '\n' + escapeHtml(annotation.value.body);
              }
            });
          }

          // Mentions
          userMentions.forEach(function(mention) {
            var name = recent.content.text.substr(mention.pos, mention.len);
            entities.push({
              pos: mention.pos,
              len: mention.len,
              html: '<a href="/user/' + name.substr(1) + '">' + name + '</a>'
            });
          });

          // Hashtags
          recent.content.entities.tags.forEach(function(hashtag) {
            var name = recent.content.text.substr(hashtag.pos, hashtag.len);
            entities.push({
              pos: hashtag.pos,
              len: hashtag.len,
              html: '<a href="/#/tagged/' + name.substr(1) + '" class="tags">' + name + '</a>'
            });
          });

          var options = {
            crosspost: crosspost,
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

          if (recent.content.entities.links.length > 0) {
            processLink(0, entities, options, callback);
          } else {
            continueRendering(entities, options, callback);
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
exports.generateInteractions = function(req, recentMessages, paginated, callback) {
  var newMessages = [];
  var recentList = recentMessages.data;
  var userSession = this.getUser(req);
  var username = userSession.username;
  var messageCount = 0;

  if (recentList.length > 0) {
    var ct = 0;
    recentList.forEach(function(recent) {
      ct = ct+1;
      // temp fix
      try {
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
          } else if (recent.action === 'bookmark') {
            message = 'Bookmarked <a href="/#/post/' + messageItem.id + '/' + username + '">your post</a>';
            icon = '<span class="action-icon star"></span>';
          } else if (recent.action === 'repost') {
            message = 'Reposted <a href="/#/post/' + messageItem.id + '/' + username + '">your post</a>';
            icon = '<span class="action-icon repost"></span>';
          }
          
          var options = {
            id: messageItem.id,
            pagination_id: recent.pagination_id,
            users: users,
            message: message,
            minId: recentMessages.meta.min_id,
            icon: icon
          };

          newMessages.push(options);

          newMessages = newMessages.sort(function(a, b) {
            return parseInt(a.pagination_id, 10) - parseInt(b.pagination_id, 10);
          });
      } catch (err) {
          console.log(recent);
          return false;
      }
      if (ct === recentList.length) {
        callback(newMessages)
      }
    });
  } else {
    callback(newMessages);
  }
};
