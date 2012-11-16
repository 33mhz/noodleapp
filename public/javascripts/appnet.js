'use strict';

define(['jquery', 'version-timeout', 'friends', 'jquery.caret'],
  function ($, versionTimeout, friends) {

  var messages = $('ol.messages');
  var myFeed = $('.my-feed');
  var overlay = $('#overlay');
  var tabs = $('ol.tabs');
  var currentFeed = tabs.find('li.selected').data('url');
  var userListMeta = $('<ol class="avatars"></ol>');
  var userId = messages.data('userid');
  var sinceId = null;
  var beforeId = null;
  var isFragment = false;
  var flashMsg = $('#flash-message');
  var loggedIn = false;
  var notifications = $('#notifications');
  var notificationsPreview = $('#notifications-preview');
  var unreadMessages = $('#unread-messages');
  var unreadMessagesNest = unreadMessages.find('ol');
  var currentMentionPostId = false;
  var loggedInId = $('body').data('sessionid');
  var loggedInUsername = $('body').data('username');
  var noTouch = '';
  var newCount = 0;
  var paginationLock = false;
  var postLoaded = false;
  var unreadMessageCount = 0;
  var textarea = overlay.find('.write textarea');

  if (!('ontouchstart' in document.documentElement)) {
    noTouch = 'no-touch';
  }

  var MESSAGE_LIMIT = 49;
  var POLL_TIMEOUT = 25000;

  // Wait 25 seconds to get new data
  var pollMessages = function() {
    setTimeout(function() {
      setMessage(currentFeed, type);
      setNotification();
    }, POLL_TIMEOUT);
  };

  var updateTime = function() {
    messages.find('time').each(function(idx, item) {
      var self = $(item);
      var oldTime = new Date(self.data('created'));
      var newTime = new Date(oldTime.getTime() + POLL_TIMEOUT);
      self.text(dateDisplay(newTime));
    });
  };

  var generateCloseLink = function() {
    return '<ol class="message-summary"><li class="close"><a title="Close">Close</a></li></ol>';
  }

  var dateDisplay = function(time) {
    var date = new Date(time);
    var diff = (Date.now() - date) / 1000;
    var dayDiff = Math.floor(diff / 86400);

    if (isNaN(dayDiff)) {
      return '?';
    }

    if (dayDiff <= 0) {
      if (diff < 60) {
        return '< 1m';
      } else if (diff < 3600) {
        return Math.floor(diff / 60) + 'm';
      } else {
        return Math.floor(diff / 3600) + 'h';
      }
    } else {
      return dayDiff + 'd';
    }
  };

  var serverRequest = function(url, type, data, callback) {
    $.ajax({
      url: url,
      type: type,
      data: data,
      dataType: 'json',
      cache: false
    }).always(function(data) {
      if (callback) {
        callback();
      }
    }).error(function(data) {
      overlay.find('.inner-overlay').html(generateCloseLink());
      flashMessage(JSON.parse(data.responseText).error);
    });
  };

  var setFollow = function(url, userId) {
    overlay.find('.inner-overlay').html('<ol class="messages"><li class="message-item loading"></li></ol>');
    overlay.slideDown();
    $.ajax({
      url: url,
      type: 'GET',
      data: { user_id: userId },
      dataType: 'json',
      cache: false

    }).done(function(data) {
      var userList = $('<ol class="users"></ol>');
      for (var i = 0; i < data.users.length; i ++) {
        var user = $('<li><a href=""><img src=""><span class="name"></span></a></li>');
        user.find('img').attr('src', data.users[i].avatar_image.url);
        user.find('a')
          .attr('href', '/user/' + data.users[i].username + '/')
          .find('span.name').html(data.users[i].name + ' <em>@' + data.users[i].username + '</em>');
        userList.append(user);
      }
      userList.append('<li class="close"><a title="Close">Close</a></li>');
      overlay.find('.inner-overlay').html(userList);
    }).error(function(data) {
      flashMessage(JSON.parse(data.responseText).error);
    });
  };

  var generatePostItem = function(message, detailExtras) {
    var notify = '';
    var messageId = message.id;

    if (message.message.indexOf('@' + loggedInUsername) > -1) {
      notify = 'notify';
    }
    return $('<li class="message-item ' + notify + '" data-mentions="" data-repostid="' + message.repostId +
      '" data-replyto="" data-original="" data-id="' +
      messageId + '" ' + 'data-username="' + message.username + '" data-minid="' + message.min_id + '">' +
      '<div class="post-wrapper"><div class="meta"><a href="" class="who" title=""><img src=""></a>' +
      '<div class="details"><a href="" class="username"></a><a href="" class="fullname"></a>' +
      '<time data-created="" title="Post details"></time>' +
      '</div></div><p></p>' + detailExtras + '</div></li>');
  };

  var setMessageMetadata = function(messageItem, message) {
    // reply to id
    message.attr('data-replyto', messageItem.reply_to);
    // plain text
    message.attr('data-original', messageItem.text);
    // user's profile page
    message.find('a.who')
      .attr('title', messageItem.name + ' @' + messageItem.username)
      .attr('href', '/user/' + messageItem.username + '/');
    // user's full name
    message.find('a.fullname')
      .attr('href', '/user/' + messageItem.username + '/')
      .attr('title', messageItem.name)
      .text(messageItem.name);
    // user's username
    message.find('a.username')
      .attr('href', '/user/' + messageItem.username + '/')
      .attr('title', messageItem.username)
      .text(messageItem.username);
    // time
    message.find('time')
      .text(dateDisplay(messageItem.created_at))
      .attr('data-created', messageItem.created_at)
      .attr('data-username', messageItem.username);
    // user's avatar
    message.find('a.who img').attr('src', messageItem.user);
    // user's message

    message.find('p').html(messageItem.message.replace(/\n/gm, '<br>'));

    return message;
  };

  var generateDetails = function(msg, showMeta) {
    var detailExtras = '';
    var isRepost = '';
    var isThread = '';
    var metaInfo = '';
    var isStarred = '<li class="star"><a title="Star" href="javascript:;"><span>Star</span></a></li>';

    if (!msg.isSelf && !msg.repostId) {
      if (msg.isRepost) {
        isRepost = '<li class="repost on"><a title="Unrepost" href="javascript:;"><span>Unrepost</span></a></li>';
      } else {
        isRepost = '<li class="repost"><a title="Repost" href="javascript:;"><span>Repost</span></a></li>';
      }
    }

    if (msg.isThread) {
      isThread = '<li class="thread"><a title="Thread" href="javascript:;"><span>Thread</span></a></li>';
    }

    if (msg.isStarred) {
      isStarred = '<li class="star on"><a title="Unstar" href="javascript:;"><span>Unstar</span></a></li>';
    }

    if (showMeta) {
      metaInfo = '<div class="info"><ol>' +
        '<li class="reposts">Reposts: <span></span></li>' +
        '<li class="stars">Stars: <span></span></li>' +
        '<li class="replies">Replies: <span></span></li></ol></div>' +
        '<div id="avatar-pings"></div><div id="thread-detail"></div>';
    }

    detailExtras = '<ul class="actions ' + noTouch + '">' + isThread +
      isStarred + '<li class="reply"><a title="Reply" href="javascript:;"><span>Reply</span></a></li>' + isRepost +
      '<li class="quote"><a title="Quote" href="javascript:;"><span>Quote</span></a></li></ul>' + metaInfo;

    return detailExtras;
  };

  var setPost = function(data, url, showDetails, isDetailOverlay, ascending, callback) {
    overlay.find('.inner-overlay').html('<ol class="messages"><li class="message-item loading"></li></ol>');
    overlay.slideDown();
    var messageOverlay = $('<ol class="message-summary"></ol>');

    $.ajax({
      url: url,
      type: 'GET',
      data: data,
      dataType: 'json',
      cache: false

    }).done(function(data) {
      if (data.messages && data.messages.length > 0) {
        for (var i = 0; i < data.messages.length; i ++) {
          // Avoid displaying duplicate messages if they are already there
          if (overlay.find('li.message-item[data-id="' + data.messages[i].id + '"]').length === 0) {
            var detailExtras = '';

            if (showDetails) {
              detailExtras = generateDetails(data.messages[i], true);
            }

            var message = generatePostItem(data.messages[i], detailExtras);
            message = setMessageMetadata(data.messages[i], message);

            if (showDetails) {
              message.find('p').append('<span class="source">Posted from ' + data.messages[i].appSource + '</span>');
              message.find('.info .reposts span').text(data.messages[i].numReposts);
              message.find('.info .stars span').text(data.messages[i].numStars);
              message.find('.info .replies span').text(data.messages[i].numReplies);
              message.attr('data-mentions', data.messages[i].mentions);
            }

            if (ascending) {
              messageOverlay.prepend(message);
            } else {
              messageOverlay.append(message);
            }

            if (showDetails) {
              var username = '';
              if (username !== loggedInUsername) {
                username = '@' + messageOverlay.find('.message-item').data('username');
              }
              var mentionList = messageOverlay.find('.message-item').data('mentions');
              // If there are any other mentions, add them to the username
              if (mentionList.length > 0) {
                username += ' ' + messageOverlay.find('.message-item').data('mentions');
              }
              textarea.val(username + ' ');
              textarea.focus();
              textarea.moveCursorToEnd();
            }
          }
        }

        if (callback) {
          callback();
        }
      }

      if (isDetailOverlay) {
        overlay.find('#thread-detail').html(messageOverlay);
      } else {
        messageOverlay.append('<li class="close"><a title="Close">Close</a></li>');
        overlay.find('.inner-overlay').html(messageOverlay);
        overlay.slideDown();
      }
    }).error(function(data) {
      overlay.find('.inner-overlay').html(generateCloseLink());
      flashMessage(JSON.parse(data.responseText).error);
    });
  };

  var setUnreadMessages = function(messageItem, paginated, message) {
    if (paginated) {
      messages.append(message);
    } else {
      if (postLoaded && messageItem.username !== loggedInUsername && messages.find('> li').length > 0) {
        if (unreadMessagesNest.find('li.message-item[data-id="' + messageItem.id + '"]').length === 0) {
          unreadMessageCount ++;
          unreadMessagesNest.prepend(message);
        }
        if (unreadMessageCount > 0) {
          unreadMessages.fadeIn();
        }
        if (unreadMessageCount > MESSAGE_LIMIT) {
          unreadMessageCount = MESSAGE_LIMIT;
        }
        unreadMessages.find('h2').text(unreadMessageCount + ' unread');
        unreadMessagesNest.find('> li:gt(' + MESSAGE_LIMIT + ')').remove();
      } else {
        messages.prepend(message);
      }
    }
    beforeId = null;
  };

  var setMessage = function(url, type, paginated, isStarredFeed) {
    currentFeed = url;

    if (!loggedIn) {
      friends.setBFFs();
      loggedIn = true;
    }

    if (!isFragment && !paginated) {
      messages.html('<li class="message-item loading"></li>');
    }

    if (paginated) {
      if (isStarredFeed) {
        beforeId = parseInt(messages.find('li.message-item').last().data('minid'), 10);
      } else {
        beforeId = parseInt(url.split('/paginated/feed/')[1].split('/')[1], 10);
      }
      messages.find('#paginated')
        .addClass('loading');
    }
    $.ajax({
      url: url,
      type: type,
      data: { since_id: sinceId, before_id: beforeId },
      dataType: 'json',
      cache: false

    }).done(function(data) {
      if (data.messages && data.messages.length > 0) {
        messages.find('li.loading').remove();

        for (var i = 0; i < data.messages.length; i ++) {
          var messageItem = data.messages[i];

          if (messages.find('li.message-item[data-id="' + messageItem.id + '"]').length === 0) {
            var detailExtras = generateDetails(messageItem, false);

            var message = generatePostItem(messageItem, '');

            message.find('.post-wrapper').append(detailExtras);

            // user mentions in this post
            message.attr('data-mentions', messageItem.mentions);
            message = setMessageMetadata(messageItem, message);

            setUnreadMessages(messageItem, paginated, message);
          }
        }

        beforeId = null;

        if (paginated && paginationLock) {
          messages.find('#paginated').removeClass('loading');
        } else {
          if (unreadMessagesNest.find('> li').length > 0) {
            sinceId = unreadMessagesNest.find('> li:first-child').data('id');
          } else {
            sinceId = messages.find('> li:first-child').data('id');
          }
        }

        if (messages.find('> li').length >= 20 && messages.find('#paginated').length === 0) {
          messages.append('<li id="paginated">View Older</li>');
        }

      } else {
        messages.find('li.loading').remove();
      }

      if (!isFragment) {
        clearTimeout(pollMessages);
      }

      isFragment = true;

      if (!paginated) {
        pollMessages = setTimeout(function() {
          versionTimeout.checkVersion();
          currentFeed = tabs.find('li.selected').data('url');
          setMessage(currentFeed, type, false, isStarredFeed);
          setNotification();
          updateTime();
          postLoaded = true;
        }, POLL_TIMEOUT);
      }
    }).error(function(data) {
      overlay.find('.inner-overlay').html(generateCloseLink());
      flashMessage(JSON.parse(data.responseText).error);
    });
  };

  var setInteractionMessage = function(url, type, paginated) {
    currentFeed = url;

    if (!isFragment && !paginated) {
      messages.html('<li class="message-item loading"></li>');
    }

    if (paginated) {
      beforeId = parseInt(messages.find('li.message-item').last().data('minid'), 10);
      messages.find('#paginated')
        .addClass('loading');
    }
    $.ajax({
      url: url,
      type: type,
      data: { since_id: sinceId, before_id: beforeId },
      dataType: 'json',
      cache: false

    }).done(function(data) {
      if (data.messages && data.messages.length > 0) {
        messages.find('li.loading').remove();

        for (var i = 0; i < data.messages.length; i ++) {
          var messageItem = data.messages[i];
          if (messages.find('li.message-item[data-id="' + messageItem.id + '"]').length === 0) {
            var message = $('<li class="message-item" data-id="' +
              messageItem.id + '" ' + 'data-minid="' +
              messageItem.minId + '">' +
              '<div class="post-wrapper"><div class="meta"><div class="users"></div>' +
              '<div class="details"><span class="action"></span>' +
              '</div></div><p></p></div></li>');

            for (var j = 0; j < messageItem.users.length; j ++) {
              var userList = messageItem.users[j];
              var user = $('<a href="" class="who" title=""><img src=""></a>');
              user.attr('href', '/user/' + userList.username);
              user.attr('title', userList.name);
              user.find('img').attr('src', userList.avatar_image.url);
              message.find('.users').append(user);
            }

            message.find('.details span').text(messageItem.action);
            message.find('p').html(messageItem.message);

            setUnreadMessages(messageItem, paginated, message);
          }
        }

        beforeId = null;

        if (paginated && paginationLock) {
          messages.find('#paginated').removeClass('loading');
        } else {
          if (unreadMessagesNest.find('> li').length > 0) {
            sinceId = unreadMessagesNest.find('> li:first-child').data('id');
          } else {
            sinceId = messages.find('> li:first-child').data('id');
          }
        }

        if (messages.find('> li').length >= 20 && messages.find('#paginated').length === 0) {
          messages.append('<li id="paginated">View Older</li>');
        }

      } else {
        messages.find('li.loading').remove();
      }

      if (!isFragment) {
        clearTimeout(pollMessages);
      }

      isFragment = true;

      if (!paginated) {
        pollMessages = setTimeout(function() {
          versionTimeout.checkVersion();
          currentFeed = tabs.find('li.selected').data('url');
          setInteractionMessage(currentFeed, type, false);
          setNotification();
          postLoaded = true;
        }, POLL_TIMEOUT);
      }
    }).error(function(data) {
      overlay.find('.inner-overlay').html(generateCloseLink());
      flashMessage(JSON.parse(data.responseText).error);
    });
  };

  var setNotification = function() {
    // If the currentMentionPostId has not been set, get the latest post id and set it
    if (!currentMentionPostId) {
      $.ajax({
        url: '/user/mentions/' + loggedInId + '/',
        data: { count: 1, ping: 1 },
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(function(data) {
        currentMentionPostId = data.messages[0].id;
      }).error(function(data) {
        overlay.find('.inner-overlay').html(generateCloseLink());
        flashMessage(JSON.parse(data.responseText).error);
      });

    // We have a currentMentionPostId set but we need to check for new mentions and update it accordingly
    } else {
      $.ajax({
        url: '/user/mentions/' + loggedInId + '/',
        data: { since_id: parseInt(currentMentionPostId, 10), paginated: 1, ping: 1 },
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(function(data) {
        if (data.messages && data.messages.length > 0) {
          for (var i = 0; i < data.messages.length; i ++) {
            if (notificationsPreview.find('li a[data-postid="' + data.messages[i].id + '"]').length === 0) {
              var messageItem = $('<li><a class="notification-item" href="#" data-postid="" data-username="">' +
                '<h2></h2><p></p></a></li>');
              messageItem.find('a')
                .attr('data-postid', data.messages[i].id)
                .attr('data-username', data.messages[i].username);
              messageItem.find('h2').text(data.messages[i].username);
              messageItem.find('p').text(data.messages[i].text);
              notificationsPreview.prepend(messageItem);
              notificationsPreview.find('> li:gt(' + (MESSAGE_LIMIT - 10) + ')').remove();
              newCount ++;
            }
          }

          if (newCount > 0) {
            var title = document.title;

            if (title.indexOf('] ') > -1) {
              title = title.split('] ')[1];
            }
            document.title = '[' + newCount + '] ' + title;
            notifications.text(newCount);
            notifications.addClass('on');

            // Set in a Fluid app if the user supports it
            if (window.fluid) {
              if (window.fluid.dockBadge) {
                window.fluid.dockBadge = newCount;
              } else {
                window.fluid.dockBadge = 1;
              }
            }
          }

          currentMentionPostId = data.messages[data.messages.length - 1].id;
        }
      }).error(function(data) {
        flashMessage(JSON.parse(data.responseText).error);
      });
    }
  };

  var setUsers = function(id, url, type) {
    userListMeta.empty();
    $.ajax({
      url: url,
      type: type,
      data: { post_id: id },
      dataType: 'json',
      cache: false
    }).done(function(data) {
      for (var i = 0; i < data.users.length; i ++) {
        var userItem = data.users[i];

        if (userListMeta.find('li[data-avatarid="' + userItem.id + '"]').length === 0) {
          var user = $('<li data-avatarid=""><a href=""><img src="" alt="" title=""></a></li>');
          user.attr('data-avatarid', userItem.id);
          user.find('a').attr('href', '/user/' + userItem.username + '/');
          user.find('img')
            .attr('src', userItem.avatar_image.url)
            .attr('alt', userItem.name)
            .attr('title', userItem.name);
          userListMeta.append(user);
        }
      }

      overlay.find('#avatar-pings').html(userListMeta);
    }).error(function(data) {
      overlay.find('.inner-overlay').html(generateCloseLink());
      flashMessage(JSON.parse(data.responseText).error);
    });
  };

  var getStarredUsers = function(postId) {
    setUsers(postId, '/starred_users', 'GET');
  };

  var getRepostedUsers = function(postId) {
    setUsers(postId, '/reposted_users', 'GET');
  };

  var flashMessage = function(message) {
    flashMsg.text(message);
    flashMsg.fadeIn(200, function() {
      $(this).fadeOut(3500);
    });
  };

  var resetActions = function() {
    postLoaded = false;
    unreadMessageCount = 0;
    unreadMessages.find('ol').empty();
    unreadMessages.removeClass('on');
    unreadMessages.hide();
    isFragment = false;
    paginationLock = false;
    sinceId = null;
  };

  var resetFluid = function() {
    if (window.fluid) {
      window.fluid.dockBadge = '';
    }
  };

  var resetNotificationDisplay = function() {
    notifications
      .removeClass('on')
      .text(0);
    document.title = 'NoodleApp';
    self.resetUnread();
  };

  var self = {
    getMyFeed: function() {
      resetActions();
      setMessage('/my/feed', 'GET', false, false);
    },

    getUserPosts: function() {
      resetActions();
      setMessage('/user/posts/' + userId, 'GET', false, false);
    },

    getUserMentions: function() {
      resetActions();
      resetNotificationDisplay();
      setMessage('/user/mentions/' + userId, 'GET', false, false);
    },

    getUserInteractions: function() {
      resetActions();
      setInteractionMessage('/user/interactions/' + userId, 'GET', false, false);
    },

    getUserStarred: function() {
      resetActions();
      setMessage('/user/starred/' + userId, 'GET', false, true);
    },

    getGlobalFeed: function() {
      resetActions();
      setMessage('/global/feed', 'GET', false, false);
    },

    starMessage: function(id, csrf) {
      isFragment = true;
      serverRequest('/star', 'POST', { post_id: id, _csrf: csrf }, function() {
        flashMessage('Starred!');
      });
    },

    unstarMessage: function(id, csrf) {
      isFragment = true;
      serverRequest('/star', 'DELETE', { post_id: id, _csrf: csrf }, function() {
        flashMessage('Unstarred!');
      });
    },

    repostMessage: function(id, csrf) {
      isFragment = true;
      serverRequest('/repost', 'POST', { post_id: id, _csrf: csrf }, function() {
        flashMessage('Reposted!');
      });
    },

    unrepostMessage: function(id, csrf) {
      isFragment = true;
      serverRequest('/repost', 'DELETE', { post_id: id, _csrf: csrf });
    },

    follow: function(id, username, csrf) {
      isFragment = true;
      serverRequest('/follow', 'POST', { user_id: id, username: username, _csrf: csrf }, function() {
        flashMessage('Followed!');
      });
    },

    unfollow: function(id, username, csrf) {
      isFragment = true;
      serverRequest('/follow', 'DELETE', { user_id: id, username: username, _csrf: csrf }, function() {
        flashMessage('Unfollowed');
      });
    },

    mute: function(id, username, csrf) {
      isFragment = true;
      serverRequest('/mute', 'POST', { user_id: id, username: username, _csrf: csrf }, function() {
        flashMessage('Muted!');
      });
    },

    unmute: function(id, username, csrf) {
      isFragment = true;
      serverRequest('/mute', 'DELETE', { user_id: id, username: username, _csrf: csrf }, function() {
        flashMessage('Unmuted!');
      });
    },

    postMessage: function(form) {
      isFragment = true;
      serverRequest('/post', 'POST', form.serialize(), function() {
        // for now let's only show the new message if we're on 'my feed'
        if (tabs.find('.my-feed').hasClass('selected')) {
          setMessage('/my/feed', 'GET', false, false);
          sinceId = messages.find('> li:first-child').data('id');
        }

        form.find('textarea').removeClass('on');
        form.find('.form-action-wrapper').slideUp('fast');

        flashMessage('Posted!');
      });
    },

    deleteMessage: function(postId, csrf) {
      isFragment = true;
      serverRequest('/post', 'DELETE', { post_id: postId, _csrf: csrf });
    },

    showFollowers: function() {
      overlay.find('.write').hide();
      setFollow('/followers', userId);
    },

    showFollowing: function() {
      overlay.find('.write').hide();
      setFollow('/following', userId);
    },

    showThread: function(postId) {
      overlay.find('.write').hide();
      setPost({ 'post_id': postId }, '/thread', false, false, false);
    },

    showTagged: function(tag) {
      overlay.find('.write').hide();
      setPost({ 'tag': tag }, '/tags', false, false, true);
    },

    showPost: function(postId) {
      overlay.find('.write').show();
      overlay.find('.reply_to').val(postId);
      newCount = 0;
      resetFluid();

      setPost({ 'post_id': postId }, '/post', true, false, false, function() {
        setPost({ 'post_id': postId }, '/thread', false, true, false);
        getStarredUsers(postId);
        getRepostedUsers(postId);
      });
    },

    resetUnread: function() {
      newCount = 0;
      resetFluid();
    },

    getOlderPosts: function(postId) {
      isFragment = true;
      paginationLock = true;
      var isStarredFeed = false;
      if (tabs.find('.selected').hasClass('user-interactions')) {
        setInteractionMessage('/paginated/interactions', 'GET', true);
      } else {
        if (tabs.find('.selected').hasClass('user-starred')) {
          isStarredFeed = true;
        }
        setMessage('/paginated/feed/' + userId + '/' + postId, 'GET', true, isStarredFeed);
      }
    },

    clearUnread: function(self) {
      messages.prepend(unreadMessagesNest.find('li.message-item'));
      unreadMessages.find('h2').empty();
      unreadMessages.find('ol').empty();
      unreadMessageCount = 0;
      self.fadeOut();
      messages.find('> li:gt(' + MESSAGE_LIMIT + ')').remove();
    }
  };

  return self;
});
