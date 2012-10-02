'use strict';

define(['jquery', 'version-timeout', 'jquery.autocomplete'],
  function ($, versionTimeout) {

  var messages = $('ol.messages');
  var currentFeed = '/my/feed';
  var myFeed = $('.my-feed');
  var overlay = $('#overlay');
  var tabs = $('ol.tabs');
  var userListMeta = $('<ol class="avatars"></ol>');
  var userId = messages.data('userid');
  var sinceId = null;
  var beforeId = null;
  var isFragment = false;
  var flashMsg = $('#flash-message');

  var MESSAGE_LIMIT = 19;
  var POLL_TIMEOUT = 60000;

  // Wait 1 minute to get new data
  var pollMessages = function() {
    setTimeout(function() {
      setMessage(currentFeed, type);
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

  var dateDisplay = function(time) {
    var date = new Date(time);
    var diff = (Date.now() - date) / 1000;
    var dayDiff = Math.floor(diff / 86400);

    if (isNaN(dayDiff) || dayDiff < 0) {
      return '?';
    }

    if (dayDiff === 0) {
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

  var setFollow = function(url, userId) {
    overlay.html('<ol class="messages"><li class="message-item loading"></li></ol>');
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
          .attr('href', '/user/' + data.users[i].username)
          .find('span.name').html(data.users[i].name + ' <em>@' + data.users[i].username + '</em>');
        userList.append(user);
      }
      userList.append('<li class="close">Close</li>');
      overlay.html(userList);
    });
  };

  var setPost = function(data, url, showDetails, isDetailOverlay, ascending, callback) {
    overlay.html('<ol class="messages"><li class="message-item loading"></li></ol>');
    overlay.slideDown();

    $.ajax({
      url: url,
      type: 'GET',
      data: data,
      dataType: 'json',
      cache: false

    }).always(function(data) {
      var messageOverlay = $('<ol class="message-summary"></ol>');

      if (data.messages.length > 0) {
        for (var i = 0; i < data.messages.length; i ++) {
          // Avoid displaying duplicate messages if they are already there
          if (overlay.find('li.message-item[data-id="' + data.messages[i].id + '"]').length === 0) {
            var detailExtras = '';

            if (showDetails) {
              detailExtras = '<div class="info"><ol>' +
                '<li class="reposts">Reposts: <span></span></li>' +
                '<li class="stars">Stars: <span></span></li>' +
                '<li class="replies">Replies: <span></span></li></ol></div>' +
                '<div id="avatar-pings"></div><div id="thread-detail"></div>';
            }

            var message = $('<li class="message-item" data-id="' +
              data.messages[i].id + '" ' + 'data-username="' + data.messages[i].username + '">' +
              '<div class="meta"><a href="" class="who" title=""><img src=""></a>' +
              '<div class="details"><a href="" class="username"></a><time data-created=""></time>' +
              '</ol></div></div><p></p>' + detailExtras + '</li>');
            // user's profile page
            message.find('a.who')
              .attr('title', data.messages[i].name)
              .attr('href', '/user/' + data.messages[i].username);
            // user's full name
            message.find('a.username')
              .attr('href', '/user/' + data.messages[i].username)
              .text(data.messages[i].name);
            // time
            message.find('time')
              .text(dateDisplay(data.messages[i].created_at))
              .attr('data-created', data.messages[i].created_at);
            // user's avatar
            message.find('a.who img').attr('src', data.messages[i].user);
            // user's message
            message.find('p').html(data.messages[i].message);

            if (showDetails) {
              message.find('p').append('<span>Posted from ' + data.messages[i].appSource + '</span>');
              message.find('.info .reposts span').text(data.messages[i].numReposts);
              message.find('.info .stars span').text(data.messages[i].numStars);
              message.find('.info .replies span').text(data.messages[i].numReplies);
            }

            if (ascending) {
              messageOverlay.prepend(message);
            } else {
              messageOverlay.append(message);
            }

            if (callback) {
              callback();
            }
          }
        }
      }

      if (isDetailOverlay) {
        overlay.find('#thread-detail').html(messageOverlay);
      } else {
        messageOverlay.append('<li class="close">Close</li>');
        overlay.html(messageOverlay);
        overlay.slideDown();
      }
    });
  };

  var setMessage = function(url, type, paginated) {
    currentFeed = url;

    if (!isFragment && !paginated) {
      messages.html('<li class="message-item loading"></li>');
    }

    if (paginated) {
      beforeId = parseInt(url.split('/paginated/feed/')[1].split('/')[1], 10);
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
      if (data.messages.length > 0) {
        messages.find('li.loading').remove();

        for (var i = 0; i < data.messages.length; i ++) {
          if (messages.find('li.message-item[data-id="' + data.messages[i].id + '"]').length === 0) {
            var isRepost = '';
            var threadAction = '';
            var isStarred = '<li class="star"></li>';
            var isDeletable = '';

            if (data.messages[i].isSelf) {
              isDeletable = '<li class="delete"></li>';
            } else {
              isRepost = '<li class="repost"></li>';

              if (data.messages[i].isRepost) {
                isRepost = '<li class="repost on"></li>';
              }
            }

            if (data.messages[i].isThread) {
              threadAction = '<li class="thread"></li>';
            }

            if (data.messages[i].isStarred) {
              isStarred = '<li class="star on"></li>';
            }

            var message = $('<li class="message-item" data-mentions="" data-id="' +
              data.messages[i].id + '" ' + 'data-username="' + data.messages[i].username + '">' +
              '<div class="meta"><a href="" class="who" title=""><img src=""></a>' +
              '<div class="details"><a href="" class="username"></a><time data-created=""></time>' +
              '<ol class="actions">' + threadAction + isStarred + '<li class="reply"></li>' +
              isRepost + isDeletable + '</ol></div></div><p></p></li>');
            // user mentions in this post
            message.attr('data-mentions', data.messages[i].mentions);
            // user's profile page
            message.find('a.who')
              .attr('title', data.messages[i].name)
              .attr('href', '/user/' + data.messages[i].username);
            // user's full name
            message.find('a.username')
              .attr('href', '/user/' + data.messages[i].username)
              .text(data.messages[i].name);
            // time
            message.find('time')
              .text(dateDisplay(data.messages[i].created_at))
              .attr('data-created', data.messages[i].created_at);
            // user's avatar
            message.find('a.who img').attr('src', data.messages[i].user);
            // user's message
            message.find('p').html(data.messages[i].message.replace(/\n/gm, '<br>'));

            if (paginated) {
              messages.append(message);
            } else {
              messages.prepend(message);
            }

            beforeId = null;
          }
        }

        if (paginated) {
          messages.find('#paginated').removeClass('loading');
        } else {
          messages.find('> li:gt(' + MESSAGE_LIMIT + ')').remove();
          sinceId = messages.find('> li:first-child').data('id');
        }

        if (messages.find('> li').length >= 20) {
          messages.append('<li id="paginated">View Older</li>');
        } else {

        }

      } else {
        if (paginated) {
          messages.find('#paginated').remove();
        }
      }

      if (!isFragment) {
        clearTimeout(pollMessages);
      }

      isFragment = true;

      pollMessages = setTimeout(function() {
        versionTimeout.checkVersion();
        currentFeed = tabs.find('li.selected').data('url');
        setMessage(currentFeed, type, false);
        updateTime();
      }, POLL_TIMEOUT);
    });
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
          user.find('a').attr('href', '/user/' + userItem.username);
          user.find('img')
            .attr('src', userItem.avatar_image.url)
            .attr('alt', userItem.name)
            .attr('title', userItem.name);
          userListMeta.append(user);
        }
      }

      overlay.find('#avatar-pings').html(userListMeta);
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
      $(this).fadeOut(2500);
    });
  };

  var self = {
    getMyFeed: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/my/feed', 'GET', false);
    },

    getUserPosts: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/user/posts/' + userId, 'GET', false);
    },

    getUserMentions: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/user/mentions/' + userId, 'GET', false);
    },

    getUserStarred: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/user/starred/' + userId, 'GET', false);
    },

    getGlobalFeed: function() {
      isFragment = false;
      sinceId = null;
      setMessage('/global/feed', 'GET');
    },

    starMessage: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/star',
        type: 'POST',
        data: { post_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    unstarMessage: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/star',
        type: 'DELETE',
        data: { post_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    repostMessage: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/repost',
        type: 'POST',
        data: { post_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      }).done(function() {
        flashMessage('Reposted!');
      });
    },

    unrepostMessage: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/repost',
        type: 'DELETE',
        data: { post_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    follow: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/follow',
        type: 'POST',
        data: { user_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      }).done(function() {
        flashMessage('Followed!');
      });
    },

    unfollow: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/follow',
        type: 'DELETE',
        data: { user_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      }).done(function() {
        flashMessage('Unfollowed');
      });
    },

    mute: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/mute',
        type: 'POST',
        data: { user_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      }).done(function() {
        flashMessage('Muted!');
      });
    },

    unmute: function(id, csrf) {
      isFragment = true;
      $.ajax({
        url: '/mute',
        type: 'DELETE',
        data: { user_id: id, _csrf: csrf },
        dataType: 'json',
        cache: false
      }).done(function() {
        flashMessage('Unmuted!');
      });
    },

    postMessage: function(form) {
      isFragment = true;
      $.ajax({
        url: '/post',
        type: 'POST',
        data: form.serialize(),
        dataType: 'json',
        cache: false

      }).done(function(data) {
        // for now let's only show the new message if we're on 'my feed'
        if (tabs.find('.my-feed').hasClass('selected')) {
          setMessage('/my/feed', 'GET', false);
          sinceId = data.messages[0].id;
        }
      });
    },

    deleteMessage: function(postId, csrf) {
      isFragment = true;
      $.ajax({
        url: '/post',
        type: 'DELETE',
        data: { post_id: postId, _csrf: csrf },
        dataType: 'json',
        cache: false
      });
    },

    showFollowers: function() {
      setFollow('/followers', userId);
    },

    showFollowing: function() {
      setFollow('/following', userId);
    },

    showThread: function(postId) {
      setPost({ 'post_id': postId }, '/thread', false, false, false);
    },

    showTagged: function(tag) {
      setPost({ 'tag': tag }, '/tags', false, false, true);
    },

    showPost: function(postId, userId) {
      setPost({ 'post_id': postId }, '/post', true, false, false, function() {
        setPost({ 'post_id': postId }, '/thread', false, true, false);
        getStarredUsers(postId);
        getRepostedUsers(postId);
      });
    },

    getOlderPosts: function(postId) {
      isFragment = true;
      setMessage('/paginated/feed/' + userId + '/' + postId, 'GET', true);
    },

    getBFFs: function(callback) {
      $.ajax({
        url: '/my/bffs',
        type: 'GET',
        dataType: 'json',
        cache: false
      }).done(function(data) {
        callback(data.usernames);
      });
    }
  };

  return self;
});
